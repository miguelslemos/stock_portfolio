---
name: UI Refactoring AI Prompt
overview: Create a comprehensive, well-structured AI prompt for migrating the Stock Portfolio Web UI from vanilla TypeScript to React + Tailwind CSS 4, resulting in a professional, elegant, and fluid interface.
todos:
  - id: write-prompt
    content: Write the complete UI refactoring prompt to web/.cursor/rules/ui-refactoring-prompt.md
    status: completed
isProject: false
---

# UI Refactoring Prompt for Stock Portfolio Web

## What This Plan Delivers

A single file — `web/.cursor/rules/ui-refactoring-prompt.md` — containing a detailed, ready-to-use AI prompt for the full UI migration. The prompt is designed to be used directly in Cursor (or any AI assistant) as a task instruction.

---

## Prompt Content (to be written into the file)

The prompt will be structured in these sections:

### 1. Current State Summary

- Vanilla TypeScript SPA with HTML template strings
- 1320-line monolithic CSS file (`styles.css`)
- Builder pattern for HTML (`ModalBuilder`, `YearDetailsBuilder`, `JSONSchemaBuilder`)
- `PortfolioApp.ts` (405 lines) as a monolithic controller handling DOM, events, and rendering
- Single `index.html` (307 lines) with all sections hardcoded
- Data types: `PortfolioSnapshot[]` from `ProcessPortfolioUseCase`

### 2. Target Architecture

- **React 19** with TypeScript (functional components, hooks)
- **Tailwind CSS 4** (utility-first, design tokens via CSS variables)
- **Vite 7** remains as the bundler (add `@vitejs/plugin-react`)
- Maintain the existing **Clean Architecture** (domain/application/infrastructure unchanged)
- Only the **presentation layer** gets rewritten

### 3. React Component Tree

The prompt will specify this component hierarchy based on the current UI sections:

```
App
├── Header (title, subtitle, privacy badge)
├── HelpSection (collapsible guide with steps)
├── UploadSection
│   ├── FileUploadGroup (release PDFs)
│   ├── FileUploadGroup (trade PDFs)
│   ├── JsonFileInput
│   └── ActionButtons (process, export, clear)
├── ResultsSection
│   ├── SummaryCards (total operations, position, return)
│   ├── YearlyTable (clickable rows → YearDetailModal)
│   └── OperationsTable (clickable rows → OperationDetailModal)
├── OperationDetailModal
├── YearDetailModal
│   ├── YearSummaryCards
│   ├── YearOperationsTable
│   └── TaxSummaryCards
├── JsonSchemaSection (tabs: schema/example, copy button)
└── Footer (disclaimer, GitHub link)
```

### 4. Migration Mapping

The prompt will include a clear mapping of what replaces what:

- `PortfolioApp.ts` (405 lines) → `App.tsx` + custom hooks (`usePortfolio`, `useFileUpload`)
- `ModalBuilder.ts` (276 lines) → `OperationDetailModal.tsx` component
- `YearDetailsBuilder.ts` (335 lines) → `YearDetailModal.tsx` component
- `JSONSchemaBuilder.ts` (188 lines) → `JsonSchemaSection.tsx` component
- `formatters.ts` (70 lines) → stays as utility, imported by components
- `styles.css` (1320 lines) → Tailwind utilities + `tailwind.config.ts` design tokens
- `index.html` (307 lines) → minimal shell + React root

### 5. Visual Design Direction

- **Color palette**: modernized gradient (keep purple/indigo family but more refined)
- **Typography**: Inter with a clear typographic scale
- **Spacing**: consistent 4px grid via Tailwind
- **Cards**: subtle shadows, rounded corners, hover micro-interactions
- **Tables**: zebra striping, sticky headers, hover states
- **Modals**: backdrop blur, slide-in animation, structured sections
- **Loading**: skeleton screens instead of spinner
- **Responsive**: mobile-first with sm/md/lg/xl breakpoints
- **Transitions**: smooth CSS transitions on state changes, Tailwind `transition-*` utilities
- **Dark mode**: Tailwind `dark:` variant support from the start

### 6. Key Technical Decisions in the Prompt

- State management: React `useState` + `useReducer` (no external library needed)
- Data fetching: keep existing `ProcessPortfolioUseCase` — wrap in a custom hook
- File handling: custom `useFileUpload` hook
- Formatters: reuse existing `BRLFormatter`, `USDFormatter`, `DateFormatter` as-is
- Domain/Application/Infrastructure layers: **zero changes** — only presentation rewrites
- Testing: migrate to Vitest + React Testing Library

### 7. Implementation Order

The prompt will specify a phased approach:

```
Phase 1: Setup (React, Tailwind, Vite plugin, base layout)
Phase 2: Core components (Header, Footer, UploadSection)
Phase 3: Results (SummaryCards, Tables)
Phase 4: Modals (OperationDetail, YearDetail)
Phase 5: Polish (animations, dark mode, responsive refinement)
Phase 6: Cleanup (remove old presentation files, update tests)
```

### 8. Quality Criteria

- No `any` types
- Components under 150 lines
- Custom hooks for all stateful logic
- Tailwind only (no inline styles, no CSS files except for `@tailwind` directives)
- Accessible (ARIA, keyboard navigation, focus management)
- All existing functionality preserved

