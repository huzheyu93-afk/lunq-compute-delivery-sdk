#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const VERSION = '0.1.0';

const REQUIRED_SESSION_FIELDS = ['schemaVersion', 'sessionId', 'supplier', 'buyerWorkload', 'events'];
const TERMINAL_EVENTS = new Set(['job_completed', 'job_failed', 'job_cancelled']);
const FORBIDDEN_KEY_PATTERN = /(?:private[_-]?key|secret|api[_-]?key|access[_-]?token|mnemonic|password|webhook[_-]?secret|wallet[_-]?private|seed[_-]?phrase)/i;
const SUSPICIOUS_VALUE_PATTERN = /(?:ghp_|gho_|sk_live_|xoxb-|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function parseTimestamp(value, label) {
  requireString(value, label);
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    throw new Error(`${label} must be an ISO timestamp`);
  }
  return ms;
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }

  return value;
}

function sha256(value) {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function scanForPublicSafetyIssues(value, path = '$', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForPublicSafetyIssues(item, `${path}[${index}]`, findings));
    return findings;
  }

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (FORBIDDEN_KEY_PATTERN.test(key)) {
        findings.push(`${childPath} uses a forbidden secret-like key name`);
      }
      scanForPublicSafetyIssues(child, childPath, findings);
    }
    return findings;
  }

  if (typeof value === 'string' && SUSPICIOUS_VALUE_PATTERN.test(value)) {
    findings.push(`${path} looks like a credential or private key`);
  }

  return findings;
}

function validateSession(session) {
  assertPlainObject(session, 'session');

  for (const field of REQUIRED_SESSION_FIELDS) {
    if (!(field in session)) {
      throw new Error(`session.${field} is required`);
    }
  }

  requireString(session.sessionId, 'session.sessionId');
  assertPlainObject(session.supplier, 'session.supplier');
  assertPlainObject(session.buyerWorkload, 'session.buyerWorkload');
  requireString(session.supplier.supplierId, 'session.supplier.supplierId');
  requireString(session.buyerWorkload.workloadId, 'session.buyerWorkload.workloadId');

  if (!Array.isArray(session.events) || session.events.length === 0) {
    throw new Error('session.events must be a non-empty array');
  }

  const eventIds = new Set();
  let previousTimestamp = 0;

  for (const [index, event] of session.events.entries()) {
    assertPlainObject(event, `session.events[${index}]`);
    requireString(event.eventId, `session.events[${index}].eventId`);
    requireString(event.type, `session.events[${index}].type`);
    requireString(event.actor, `session.events[${index}].actor`);

    if (eventIds.has(event.eventId)) {
      throw new Error(`duplicate eventId: ${event.eventId}`);
    }
    eventIds.add(event.eventId);

    const timestamp = parseTimestamp(event.timestamp, `session.events[${index}].timestamp`);
    if (timestamp < previousTimestamp) {
      throw new Error(`session.events[${index}] is earlier than the previous event`);
    }
    previousTimestamp = timestamp;
  }

  const findings = scanForPublicSafetyIssues(session);
  if (findings.length > 0) {
    throw new Error(`public-safety scan failed: ${findings.join('; ')}`);
  }
}

function getEventGpuCount(event, fallbackGpuCount) {
  const measured = event.measurements?.gpuCount;
  if (Number.isFinite(measured) && measured > 0) {
    return measured;
  }
  return fallbackGpuCount;
}

function calculateGpuSeconds(events, fallbackGpuCount) {
  let startedAt = null;
  let completedAt = null;
  let lastTimestamp = null;
  let lastGpuCount = fallbackGpuCount;
  let totalGpuSeconds = 0;

  for (const event of events) {
    const timestamp = parseTimestamp(event.timestamp, `event ${event.eventId} timestamp`);

    if (event.type === 'job_started') {
      startedAt = event.timestamp;
      lastTimestamp = timestamp;
      lastGpuCount = getEventGpuCount(event, fallbackGpuCount);
      continue;
    }

    if (lastTimestamp !== null && ['heartbeat', 'job_completed', 'job_failed', 'job_cancelled'].includes(event.type)) {
      const durationSeconds = Math.max(0, (timestamp - lastTimestamp) / 1000);
      totalGpuSeconds += durationSeconds * lastGpuCount;
      lastTimestamp = timestamp;
      lastGpuCount = getEventGpuCount(event, lastGpuCount);
    }

    if (TERMINAL_EVENTS.has(event.type)) {
      completedAt = event.timestamp;
      break;
    }
  }

  return {
    startedAt,
    completedAt,
    totalGpuSeconds: Math.round(totalGpuSeconds),
  };
}

export function verifyDeliverySession(session) {
  validateSession(session);

  const fallbackGpuCount = session.supplier.capacity?.gpuCount ?? 1;
  if (!Number.isFinite(fallbackGpuCount) || fallbackGpuCount < 1) {
    throw new Error('session.supplier.capacity.gpuCount must be a positive number');
  }

  const startEvents = session.events.filter((event) => event.type === 'job_started');
  const terminalEvents = session.events.filter((event) => TERMINAL_EVENTS.has(event.type));
  const warnings = [];

  if (startEvents.length !== 1) {
    warnings.push(`expected exactly one job_started event, found ${startEvents.length}`);
  }

  if (terminalEvents.length !== 1) {
    warnings.push(`expected exactly one terminal event, found ${terminalEvents.length}`);
  }

  const { startedAt, completedAt, totalGpuSeconds } = calculateGpuSeconds(session.events, fallbackGpuCount);
  const terminalType = terminalEvents[0]?.type;
  const status =
    terminalType === 'job_completed'
      ? 'completed'
      : terminalType === 'job_failed'
        ? 'failed'
        : terminalType === 'job_cancelled'
          ? 'cancelled'
          : 'incomplete';

  const requestedGpuSeconds = session.buyerWorkload.requestedGpuSeconds;
  if (Number.isFinite(requestedGpuSeconds) && totalGpuSeconds < requestedGpuSeconds) {
    warnings.push(`delivered ${totalGpuSeconds} GPU-seconds below requested ${requestedGpuSeconds}`);
  }

  const receipt = {
    receiptVersion: VERSION,
    sessionId: session.sessionId,
    status,
    supplierId: session.supplier.supplierId,
    workloadId: session.buyerWorkload.workloadId,
    startedAt,
    completedAt,
    totalGpuSeconds,
    eventHash: `sha256:${sha256(session.events)}`,
    verifier: {
      name: 'lunq-compute-delivery-sdk',
      version: VERSION,
    },
    settlementClaim: {
      unit: 'gpu_second',
      amount: totalGpuSeconds,
      mode: 'mock_only',
      note: 'Mock delivery measurement only. This does not settle funds, issue tokens, or connect to production systems.',
    },
    warnings,
  };

  return {
    sessionId: session.sessionId,
    status,
    totalGpuSeconds,
    eventCount: session.events.length,
    warnings,
    receipt,
  };
}

async function main() {
  const inputPath = process.argv[2] ?? 'examples/delivery-session.json';
  const raw = await readFile(inputPath, 'utf8');
  const session = JSON.parse(raw);
  const result = verifyDeliverySession(session);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
