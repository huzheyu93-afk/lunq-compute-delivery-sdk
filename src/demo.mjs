#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { verifyDeliverySession } from './verify-delivery.mjs';

async function main() {
  const inputPath = process.argv[2] ?? 'examples/delivery-session.json';
  const session = JSON.parse(await readFile(inputPath, 'utf8'));
  const result = verifyDeliverySession(session);

  console.log(
    JSON.stringify(
      {
        sessionId: result.sessionId,
        status: result.status,
        totalGpuSeconds: result.totalGpuSeconds,
        eventCount: result.eventCount,
        warnings: result.warnings,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
