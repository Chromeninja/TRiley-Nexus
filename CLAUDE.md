# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Personal portfolio site and reusable no-code portfolio template for T. Riley Garrett. Deployed to GitHub Pages via GitHub Actions. Users fork it and customize via `portfolio-config.json` and markdown files — no code changes required.

## Commands

```bash
npm run dev                          # Astro dev server at localhost:4321
npm run content-editor               # Local markdown editor UI at localhost:4387
npm run build                        # Static build to dist/
npm run preview                      # Preview built site
npm run check                        # astro check + tsc (requires Node ≥ 22.12.0)
npm run lint                         # ESLint on .js/.ts/.astro
npm run lint:fix                     # Auto-fix ESLint issues
npm run format                       # Prettier formatting
npm run format:check                 # Check formatting without writing
npm run normalize-frontmatter        # Validate markdown frontmatter
npm run normalize-frontmatter:write  # Normalize and write frontmatter
```

There is no test suite — type checking (`npm run check`) is the primary correctness gate.

## Architecture

### Data Flow

```
portfolio-config.json (787 lines)
    → src/data/siteConfig.ts          (loads + types the config)
    → src/data/*.ts                   (page-specific data aggregators)
    → src/pages/*.astro               (static + dynamic [slug] routes)
    → src/components/*.astro          (scoped-CSS, typed Props)
    → dist/                           (static HTML output)
```

Content collections run in parallel with siteConfig:
```
src/content/{projects,companies,about}/*.md
    → src/content.config.ts           (Zod schemas, canonical type source)
    → getCollection() calls in pages  (merged with siteConfig in src/data/)
```

### Key Files

| File | Purpose |
|------|---------|
| `portfolio-config.json` | Primary user-facing config (name, nav, social, theme, career eras) |
| `src/content.config.ts` | Astro 6 content collection schemas — Zod, canonical type definitions |
| `src/data/siteConfig.ts` | Loads portfolio-config.json; all other data files import from here |
| `src/data/projects.ts` | Project collection helpers and filtering (largest data file) |
| `src/styles/global.css` | All design tokens as `:root` CSS custom properties |
| `tools/content-editor/server.mjs` | Express-based local UI for editing markdown (port 4387) |

### Content Collections

| Collection | Location | Required frontmatter |
|-----------|----------|---------------------|
| `projects` | `src/content/projects/*.md` | `title`, `status`, `category`, `tags`, `summary`, `featured` |
| `companies` | `src/content/companies/*.md` | `profiles` (record keyed by company slug) |
| `about` | `src/content/about/*.md` | `metaDescription`, `backgroundParagraphs`, `thinkItems`, `personalItems`, `values` |

Project `status` enum: `active | completed | archived | concept`

## Hard Rules

- **No React, Vue, or Svelte** — all components are `.astro` files only
- **No Tailwind** — use CSS custom properties from `src/styles/global.css`
- **No inline styles** — use scoped `<style>` blocks in components
- **No Alpine.js** — vanilla JS only in `<script>` blocks
- **TypeScript strict** — no `any`, no type assertions without a justifying comment
- **No hardcoded colors/spacing** — always use `var(--token-name)`
- **No em dashes in generated writing** — use commas, periods, parentheses, or colons instead
- **Astro 6 glob loader** — collection schemas must use `glob({ pattern: "**/*.md", base: "./src/content/X" })`; never use legacy `defineCollection` without a loader

## Targeted Instruction Files

More specific rules live in `.github/instructions/` and are automatically applied per directory:

- `src/components/` → `.github/instructions/astro-components.instructions.md`
- `src/content/` → `.github/instructions/content-markdown.instructions.md`
- `src/data/`, `src/content.config.ts` → `.github/instructions/data-layer.instructions.md`
- `src/styles/` → `.github/instructions/styles.instructions.md`
- `tools/` → `.github/instructions/content-editor.instructions.md`

Read the relevant instruction file before editing files in those directories.
