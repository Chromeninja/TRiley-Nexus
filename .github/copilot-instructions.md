<!-- Last reviewed: 2026-05-06 — update when stack or architecture changes -->

# TRiley-Nexus — Copilot Workspace Instructions

## What This Project Is

Personal portfolio template and live portfolio site for T.Riley Garrett. Deployed to GitHub Pages with no paid hosting. Designed as a reusable no-code template for other users to fork and customize via `portfolio-config.json`.

## Tech Stack

| Layer | Details |
|---|---|
| **Framework** | Astro 6.2.1, static output (`output: "static"`) |
| **Language** | TypeScript (strict mode — `astro/tsconfigs/strict`) |
| **Node** | ≥ 22.12.0 required |
| **Styling** | CSS custom properties only — no Tailwind, no CSS-in-JS |
| **UI Frameworks** | None — vanilla Astro components only |
| **Content** | Astro 6 content collections with glob loader |
| **Config layer** | `portfolio-config.json` — primary user customization surface |
| **Dev tools** | ESLint 10, Prettier 3, `@astrojs/check` |

## Architecture Overview

```
src/
  content/          ← Markdown files (projects, companies, about)
  content.config.ts ← Collection schemas (Zod) — canonical schema source
  data/             ← Typed data layer (merges collections + siteConfig)
  components/       ← Astro components (scoped CSS, typed Props)
  pages/            ← Astro pages (static routes + dynamic [slug] routes)
  styles/global.css ← Design token definitions (:root CSS custom properties)
portfolio-config.json ← Site-wide config (name, nav, social, theme, career eras)
tools/content-editor/ ← Local Node.js UI for editing markdown frontmatter (port 4387)
```

### Data Flow

`portfolio-config.json` → `src/data/siteConfig.ts` → consumed by all `src/data/*.ts` files → passed as typed props to Astro components.

Content collections (`getCollection("projects" | "companies" | "about")`) are loaded in pages and merged with siteConfig data where needed (see `src/data/companyProfiles.ts`).

## Hard Rules

- **No React, Vue, or Svelte** — all components are `.astro` files
- **No Tailwind** — use CSS custom properties from `src/styles/global.css`
- **No inline styles** — use scoped `<style>` blocks or CSS custom properties
- **No Alpine.js** — vanilla JS only in `<script>` blocks
- **TypeScript strict** — no `any`, no type assertions without a comment justifying them
- **No hardcoded color/spacing values** — always reference `var(--token-name)`
- **Astro 6 glob loader** — content collection schemas use `glob({ pattern: "**/*.md", base: "./src/content/X" })`; never use legacy `defineCollection` without a loader

## Key File References

- **Collection schemas**: [`src/content.config.ts`](../src/content.config.ts)
- **Design tokens**: [`src/styles/global.css`](../src/styles/global.css) (`:root` block)
- **Site config type**: [`src/data/siteConfig.ts`](../src/data/siteConfig.ts)
- **Project type + helpers**: [`src/data/projects.ts`](../src/data/projects.ts)
- **Component template**: [`src/components/PageHero.astro`](../src/components/PageHero.astro)
- **Content editor**: [`tools/content-editor/server.mjs`](../tools/content-editor/server.mjs)

## Content Collections Summary

| Collection | Location | Required fields |
|---|---|---|
| `projects` | `src/content/projects/*.md` | title, status, category, tags, summary, featured |
| `companies` | `src/content/companies/*.md` | profiles (record keyed by company slug) |
| `about` | `src/content/about/*.md` | metaDescription, backgroundParagraphs, thinkItems, personalItems, values |

Status enum for projects: `active | completed | archived | concept`

## Running Locally

```bash
npm run dev           # Astro dev server — localhost:4321
npm run content-editor  # Content editor UI — localhost:4387
npm run build         # Static build to dist/
npm run check         # TypeScript + Astro type check (requires Node ≥ 22.12.0)
```

## Targeted Instruction Files

More specific rules are loaded automatically when you edit files in these directories:

- **Astro components** (`src/components/`) → `.github/instructions/astro-components.instructions.md`
- **Markdown content** (`src/content/`) → `.github/instructions/content-markdown.instructions.md`
- **Data layer** (`src/data/`, `src/content.config.ts`) → `.github/instructions/data-layer.instructions.md`
- **Global styles** (`src/styles/`) → `.github/instructions/styles.instructions.md`
- **Content editor tools** (`tools/`) → `.github/instructions/content-editor.instructions.md`
