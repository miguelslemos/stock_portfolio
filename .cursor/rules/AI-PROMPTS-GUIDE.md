# AI Prompts Guide for Stock Portfolio Web

This document serves as a reference for **effective prompts** to use with AI during development of this project, and a **list of context files** that should be maintained in the repository.

---

## AI Context Files in the Repository

Keep these files updated in `.cursor/rules/` so the AI always has the correct context:

| File | Type | Purpose |
|------|------|---------|
| `project-overview.mdc` | Always Apply | Stack, folder structure, and fundamental project rules |
| `architecture.mdc` | Glob: `src/**/*.ts` | Clean Architecture, layers, applied design patterns |
| `code-style.mdc` | Glob: `src/**/*.ts` | Code style, clarity, strict TypeScript, conventions |
| `ui-presentation.mdc` | Glob: `presentation/**` | Professional UI, component reuse, CSS |
| `domain-logic.mdc` | Glob: `domain/**/*.ts` | Business rules, immutability, domain isolation |
| `testing.mdc` | Glob: `__tests__/**` | Testing patterns, priorities, best practices |
| `new-features.mdc` | Always Apply | Checklist and order for implementing new features |

### Other Recommended Context Files

In addition to `.cursor/rules/`, maintain these docs in the repository:

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE.md` | High-level architecture overview (for humans and AI) |
| `docs/guia_negocio.md` | Tax business rules (domain context) |
| `web/README.md` | Setup, scripts, and web app overview |
| `examples/sample-operations.json` | Sample data for testing and context |

---

## Best Prompts for Each Situation

### 1. Create a New Feature

```
Implement [feature] following the project's Clean Architecture:
1. Start by defining the interface in application/interfaces/
2. Implement the entity/service in domain/ if business rules are involved
3. Create the concrete implementation in infrastructure/
4. Integrate into the UI in presentation/
5. Add unit tests for the domain layer

Keep the code self-explanatory without unnecessary comments.
Reuse existing Builders for UI components.
```

### 2. Refactor Existing Code

```
Refactor [component/class] applying:
- Separation of concerns (single responsibility per class)
- Extract business logic to domain/ if it's in presentation/
- Use dependency injection instead of direct instantiation
- Keep the public interface compatible
- Add/update tests to cover the refactoring

Don't add comments — rename variables and functions to be self-explanatory.
```

### 3. Add a UI Component

```
Create a UI component for [description] following the project's patterns:
- Use the Builder Pattern (like ModalBuilder and YearDetailsBuilder)
- Reuse existing CSS variables (--color-*, --shadow-*, --radius-*)
- Professional and clean appearance, consistent with the rest of the application
- No inline styles — use CSS classes
- The component should receive pre-processed data, with no business logic

Check if a similar builder already exists that can be extended.
```

### 4. Implement Parsing/Integration

```
Implement [parser/integration] in infrastructure/:
1. Define the interface in application/interfaces/
2. Create the implementation in infrastructure/repositories/ or infrastructure/services/
3. Use the Composite Pattern if you need to combine multiple sources
4. Handle errors with specific types (don't use generic strings)
5. Add tests with mock data

Follow the pattern of PDFOperationRepository and JSONOperationRepository as reference.
```

### 5. Fix a Bug

```
Investigate and fix the bug: [bug description]

1. Identify which layer the bug is in (domain/application/infrastructure/presentation)
2. Write a test that reproduces the bug BEFORE fixing it
3. Fix with the smallest possible change
4. Verify that existing tests still pass
5. The regression test should be clear and descriptive

Don't add comments like "fix bug" — the regression test is the documentation.
```

### 6. Add a Business Rule

```
Implement the business rule: [rule description]

- All logic in domain/ (entities or services)
- Consult docs/guia_negocio.md for tax context
- Entities must be immutable — return new instances
- Validate invariants in the constructor
- Test coverage for all edge case scenarios
- The presentation/ layer should only display the result, no calculations
```

### 7. Optimize Performance

```
Optimize the performance of [area]:
- Identify the bottleneck with concrete data
- Prefer solutions in the correct layer (don't optimize UI if the problem is in domain)
- Maintain readability — performance doesn't justify obscure code
- Document the optimization reason if not obvious (this is a valid case for a comment)
- Add benchmarks in tests if relevant
```

### 8. Code Review

```
Review this code considering:
1. Separation of concerns — each class/function does one thing
2. Business rules are in domain/ and don't leak to other layers
3. Self-explanatory code without unnecessary comments
4. Strict TypeScript (no any, readonly where possible)
5. Reuse — no duplicated UI or logic
6. Tests cover the important scenarios
7. Follows the project's design patterns (Repository, Builder, DI, Use Case)
```

### 9. Write Tests

```
Write tests for [class/feature]:
- Use Vitest with the describe/it structure
- Descriptive names: "should [expected behavior] when [condition]"
- Independent tests (no shared state)
- Mock only interfaces, never concrete implementations
- Cover: happy path, edge cases, and expected errors
- No any in tests — use correct types or factories
```

### 10. Understand the Code

```
Explain how [component/flow] works in this project:
- Which layers are involved
- What is the data flow (input → processing → output)
- Which design patterns are used
- What are the extension points
- Where are the relevant tests
```

---

## General Tips for Effective Prompts

1. **Always reference the layer**: "in `domain/`", "in `presentation/`"
2. **Mention existing patterns**: "like `ModalBuilder`", "following the `Repository Pattern`"
3. **Be explicit about what NOT to do**: "no comments", "no any", "no business logic in the UI"
4. **Ask for tests together**: always include tests in the request to maintain coverage
5. **Reference docs**: include `@docs/guia_negocio.md` when involving tax rules
6. **Use @ for context**: `@web/src/domain/` when asking about the domain layer

---

## When to Update These Files

- **Added a new layer or pattern?** → Update `architecture.mdc` and `project-overview.mdc`
- **Changed stack or dependency?** → Update `project-overview.mdc`
- **New UI component pattern?** → Update `ui-presentation.mdc`
- **New complex business rule?** → Update `domain-logic.mdc` and `docs/guia_negocio.md`
- **Changed testing framework?** → Update `testing.mdc`
