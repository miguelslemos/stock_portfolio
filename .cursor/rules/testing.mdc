---
description: Testing patterns and practices
globs: web/src/**/__tests__/**/*.test.ts
alwaysApply: false
---

# Testing

## Setup

- Framework: Vitest 4 with V8 coverage
- Convention: `__tests__/ClassName.test.ts` alongside the source code
- `@/` alias available in tests

## Test Structure

```typescript
describe('Money', () => {
  describe('add', () => {
    it('should sum amounts with same currency', () => {
      const a = new Money(100, 'USD');
      const b = new Money(50, 'USD');
      expect(a.add(b).amount).toBe(150);
    });

    it('should throw on currency mismatch', () => {
      const usd = new Money(100, 'USD');
      const brl = new Money(50, 'BRL');
      expect(() => usd.add(brl)).toThrow('Currency mismatch');
    });
  });
});
```

## Testing Priorities

1. **Domain entities and services**: maximum coverage (business logic)
2. **Use cases**: test orchestration with mocked interfaces
3. **Infrastructure**: test parsing and integration in isolation
4. **Presentation**: test formatters; builders are visual (lower priority)

## Best Practices

- Independent tests — no shared state between `it()` blocks
- Descriptive names: "should calculate average cost when multiple vestings exist"
- Use factories or builders to create test data
- Mock interfaces (`IOperationRepository`) — never concrete implementations
- No `any` in tests
