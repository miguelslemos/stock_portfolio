---
description: UI patterns and presentation components
globs: web/src/presentation/**/*.ts, web/src/presentation/**/*.css
alwaysApply: false
---

# UI and Presentation

## Professional Look with Low Complexity

- Clean, professional appearance using pure CSS (no CSS framework)
- CSS variables for colors, shadows, and spacing (already defined in `styles.css`)
- Inter font as the typographic standard
- Responsive layout with native grid/flexbox

## Component Reuse

- Use Builders for complex HTML (`ModalBuilder`, `YearDetailsBuilder`)
- Extract repeated visual patterns into reusable functions/builders
- Never duplicate markup — if a pattern appears 2+ times, create a builder

```typescript
// ❌ Bad: duplicated HTML
const card1 = `<div class="card"><h3>${title1}</h3>...</div>`;
const card2 = `<div class="card"><h3>${title2}</h3>...</div>`;

// ✅ Good: reusable builder
const card1 = CardBuilder.create(title1).withContent(...).build();
const card2 = CardBuilder.create(title2).withContent(...).build();
```

## Presentation vs Domain Separation

- Formatters (`BRLFormatter`, `USDFormatter`) belong in `presentation/`
- Never put calculation logic in builders or UI controllers
- `PortfolioApp` coordinates the UI but delegates logic to use cases
- Data arrives at the presentation layer already processed — just format and display

## CSS

- Use existing CSS variables (`--color-*`, `--shadow-*`, `--radius-*`)
- Avoid inline styles — use classes
- Maintain a single `styles.css` file organized by section
