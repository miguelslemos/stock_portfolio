---
description: Business rules and domain logic
globs: web/src/domain/**/*.ts
alwaysApply: false
---

# Business Rules (Domain Layer)

## Principles

- **Total isolation**: zero imports from `infrastructure/`, `presentation/`, or external libs
- **Immutability**: value entities (`Money`, `StockQuantity`) must be immutable
- **Pure methods**: given the same input, always the same output
- **Self-validation**: entities validate their own invariants in the constructor

```typescript
// ✅ Value entity with validation
class Money {
  constructor(
    readonly amount: number,
    readonly currency: Currency,
  ) {
    if (amount < 0) throw new Error('Amount cannot be negative');
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

## Domain Services

- `PortfolioCalculationService`: position calculations, gain/loss, average cost
- `PortfolioAnalyticsService`: snapshots and analytical aggregations
- Receive dependencies via interface (e.g., `IExchangeRateService`)

## Operations

- `VestingOperation`: represents RSU/ESPP vesting
- `TradeOperation`: represents stock buy/sell
- Each operation is an immutable record with all required data

## When Modifying Business Rules

1. Change only in `domain/` — never in presentation
2. Write unit tests for every scenario
3. Validate against the business guide (`docs/guia_negocio.md`)
