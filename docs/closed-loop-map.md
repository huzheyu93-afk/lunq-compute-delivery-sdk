# LUNQ Compute Closed Loop

This package covers the public delivery proof layer.

```text
1. Supplier capacity
2. Buyer workload brief
3. Delivery session
4. Delivery events
5. Delivery receipt
6. Verification result
7. Mock settlement claim
```

## In This Repository

- event and receipt schemas
- synthetic delivery examples
- basic verifier code
- public-safety checks
- integration boundaries

## Outside This Repository

- production order book
- production matching
- production wallets and custody
- real settlement and clearing
- market maker accounts
- liquidity scripts
- KYC, KYB, sanctions screening, and wallet-risk integrations
- customer and supplier operating data

The exchange and settlement layers are infrastructure. The public open-source loop here is narrower: make compute delivery evidence easier to describe, validate, and improve.
