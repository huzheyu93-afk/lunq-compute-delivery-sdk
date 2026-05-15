# Integration Boundary

The safest open-source boundary is the line between public evidence format and private production operation.

## Safe To Publish

- schemas for delivery sessions and receipts
- synthetic examples
- local verifier code
- mock settlement claims
- public-safe documentation
- test fixtures with fake accounts and fake workloads

## Keep Private

- production API hosts and credentials
- production exchange, wallet, custody, redemption, and clearing logic
- market maker accounts and liquidity policy
- real buyer and supplier lists
- seed user invite codes and balances
- KYC, KYB, sanctions screening, and wallet-risk vendor integrations
- contracts, invoices, private prices, and real workload logs

## Production Upgrade Path

Teams can replace the mock verifier with stronger evidence sources:

- signed supplier logs
- buyer-side completion checks
- attested telemetry
- benchmark snapshots
- trusted execution evidence
- signed receipt anchors
- independent dispute review

Those production controls should be designed and reviewed separately before being connected to funds or user accounts.
