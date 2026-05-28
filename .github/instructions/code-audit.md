---
applyTo: "{src/components/**/*.astro,src/data/**/*.ts,src/pages/**/*.astro,src/utils/**/*.ts}"
---

<!-- Last reviewed: 2026-05-14; update when size thresholds or audit cadence changes -->

# Code Audit Guard Rails

Use this checklist for recurring monolithic-file prevention.

## Audit Cadence

- Run at least once per quarter
- Run before major content/feature pushes
- Run before creating release tags

## Size Thresholds

- Components (`src/components/**/*.astro`):
  - Target: <=5000 chars
  - Refactor trigger: >7000 chars
- Data files (`src/data/**/*.ts`):
  - Target: <=6000 chars
  - Refactor trigger: >9000 chars
- Utility files (`src/utils/**/*.ts`):
  - Target: <=4000 chars
  - Refactor trigger: >7000 chars

## Audit Commands

Run from repository root:

```bash
find src/components -name "*.astro" -exec wc -c {} + | sort -rn
find src/data -name "*.ts" -exec wc -c {} + | sort -rn
find src/utils -name "*.ts" -exec wc -c {} + | sort -rn
```

Optional focused report:

```bash
find src -type f \( -name "*.astro" -o -name "*.ts" \) -exec wc -c {} + | sort -rn | head -30
```

## Required Follow-Up When Triggered

1. Split oversized files before adding unrelated features
2. Extract pure helpers to `src/utils/` or `src/data/*Helpers.ts`
3. Extract shared types/interfaces to `src/data/` modules
4. Keep parent components as orchestration shells
5. Validate after each split:
   - `npm run check`
   - `npm run build`

## Compatibility Rules

- Preserve existing named exports during migration (re-export when needed)
- Preserve existing `data-*` attributes used by interaction scripts
- Do not change URL paths, route structure, or content schema during size-only refactors
