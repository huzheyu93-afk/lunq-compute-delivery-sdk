# Contributing

Useful contributions are small, testable, and public-safe.

Good pull requests:

- improve schema clarity
- add synthetic delivery examples
- add verifier tests or edge-case checks
- improve documentation for suppliers and buyers
- add public-safe telemetry fields without exposing private infrastructure

Out of scope:

- production wallet keys, private API credentials, custody logic, or signer code
- token reward distribution or guaranteed reward language
- production exchange, redemption, settlement, liquidity, or market-making logic
- real KYC, KYB, sanctions screening, wallet-risk, or compliance vendor configuration
- customer names, contracts, invoices, private pricing, or real workload logs

Before opening a pull request, run:

```bash
npm run check
```
