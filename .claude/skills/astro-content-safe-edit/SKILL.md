---
name: astro-content-safe-edit
description: Safely edit Astro content collections, markdown frontmatter, portfolio-config.json, and project data without breaking schema validation or build output.
paths:
  - "portfolio-config.json"
  - "src/content/**/*.md"
  - "src/content.config.ts"
  - "src/data/**/*.ts"
  - "src/pages/**/*.astro"
---

## Purpose

Keep portfolio content edits compatible with the Astro content model.

## Required checks

Before editing project markdown, inspect:
- `src/content.config.ts`
- `docs/CONTENT-TAXONOMY.md`
- `.github/instructions/content-markdown.instructions.md`

## Project markdown rules

For `src/content/projects/*.md`:

Required fields:
- `title`
- `status`
- `category`
- `tags`
- `summary`
- `featured`

Common optional fields:
- `organization`
- `organizationShortName`
- `organizationUrl`
- `roleTitle`
- `startedAt`
- `endedAt`
- `timeframe`
- `cardSummary`
- `highlights`
- `problem`
- `approach`
- `outcome`
- `skills`
- `tools`
- `cover`
- `links`
- `media`
- `order`

## Editing rules

- Preserve valid YAML frontmatter.
- Keep arrays valid.
- Quote strings with colons, percentages, or special characters.
- Keep `highlights` to maximum 3 items.
- Use canonical categories from `docs/CONTENT-TAXONOMY.md`.
- Keep tags specific and non-duplicative.
- Use `YYYY-MM` when month is known; use `YYYY` when only year is known.
- Do not change schema unless explicitly asked.
- Do not break media paths.
- Do not remove links unless broken or irrelevant.

## Validation

After edits, run:

```bash
npm run build
```

If package scripts include lint/typecheck, run those too.

Summarize any build errors and fix content-related issues.
