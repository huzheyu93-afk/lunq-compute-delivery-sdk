# LUNQ Compute Delivery SDK

Public-safe reference tools for modeling verified compute delivery.

This starter helps GPU suppliers, AI compute buyers, marketplace builders, and infrastructure teams describe a compute delivery session in a way that can be checked, replayed, and discussed publicly.

It does not connect to a production exchange, wallet, custody system, market maker, KYC provider, or sanctions screening provider. It does not issue tokens, promise rewards, calculate ROI, or implement futures, derivatives, or financial products.

## Start Here

If you operate GPUs, buy AI compute, or build infrastructure marketplaces, the best way to help is one concrete delivery signal or one synthetic delivery fixture.

- Delivery signal proposal: https://github.com/huzheyu93-afk/lunq-compute-delivery-sdk/issues/2
- Good first issue: https://github.com/huzheyu93-afk/lunq-compute-delivery-sdk/issues/3
- Buyer receipt feedback: https://github.com/huzheyu93-afk/lunq-compute-delivery-sdk/issues/1

Useful question:

> Which delivery signal would make a compute receipt credible enough for a buyer to accept?

## What This Models

The LUNQ compute loop can be described as:

```text
supplier capacity -> workload brief -> delivery session -> delivery events -> receipt -> verification -> mock settlement claim
```

This repository covers only the public verification layer:

- delivery event shape
- delivery receipt shape
- basic time and GPU-second checks
- public-safety checks for accidental secrets
- synthetic examples for builders and reviewers

Production matching, order books, funding, wallets, liquidity, compliance, customer data, and operational playbooks stay outside this repository.

## Who This Is For

### GPU suppliers

Use the schemas and examples to describe completed work without exposing customer data, private hardware identifiers, contracts, invoices, pricing, API keys, or wallet keys.

### AI compute buyers

Use the delivery receipt shape to ask suppliers for a consistent proof format before building a deeper integration.

### Marketplace and protocol builders

Use the verifier as a small reference implementation for session event checks. Replace it with stronger telemetry, trusted execution, attestation, signed logs, or audited metering when moving to production.

## Quick Start

```bash
npm install
npm run demo
npm run verify
npm run check
```

Expected output:

```json
{
  "sessionId": "lunq-delivery-demo-001",
  "status": "completed",
  "totalGpuSeconds": 7200,
  "eventCount": 5,
  "warnings": []
}
```

## Files

- `examples/delivery-session.json` - synthetic end-to-end session
- `schemas/delivery-session.schema.json` - event log schema
- `schemas/delivery-receipt.schema.json` - receipt schema
- `src/verify-delivery.mjs` - verifier module and CLI
- `src/demo.mjs` - simple demo wrapper
- `docs/closed-loop-map.md` - where this package fits in the LUNQ compute loop
- `docs/integration-boundary.md` - what is safe to publish and what must stay private

## Safe Public Claims

Use:

- verified compute delivery
- compute delivery receipt
- GPU-second metering demo
- public-safe workload evidence
- supplier delivery proof

Avoid:

- guaranteed income
- fixed mining yield
- guaranteed token value
- exchange listing claims
- futures product claims
- guaranteed supplier matching
- production settlement claims

## Security Boundary

Public issues and pull requests must only include synthetic examples or public company-level facts.

Do not post:

- API keys, wallet keys, private signatures, session tokens, webhooks, or credentials
- production detector payloads with private hardware identifiers
- personal data, customer data, contracts, invoices, or private pricing
- production LUNQ exchange, redemption, pricing, settlement, liquidity, custody, or wallet logic
- real KYC, KYB, sanctions screening, wallet-risk, or compliance vendor configurations

## License

MIT
