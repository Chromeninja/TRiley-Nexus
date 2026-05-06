---
applyTo: "{src/data/**/*.ts,src/content.config.ts}"
---
<!-- Last reviewed: 2026-05-06 — update when new collections or data patterns are added -->

# Data Layer Rules

Applies to `src/data/**/*.ts` and `src/content.config.ts`.

## TypeScript Requirements

- **Strict mode** — `astro/tsconfigs/strict` is active; `any` is forbidden
- Type assertions (`as Foo`) require an inline comment explaining why
- All exported values must have an explicit return type or inferred type that is exported alongside them
- Use `type` imports for type-only imports: `import type { CollectionEntry } from "astro:content"`

## Content Collections (Astro 6)

Always use the **glob loader** pattern when defining collections:

```typescript
import { defineCollection } from "astro:content";
import { z } from "astro:schema";
import { glob } from "astro/loaders";

const myCollection = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/my-collection",
  }),
  schema: z.object({
    // ...fields
  }),
});
```

- Never use legacy `defineCollection` without a `loader`
- Schema lives in `src/content.config.ts` — do not duplicate schema definitions in `src/data/`
- Import `z` from `"astro:schema"`, not directly from `"zod"`

## Data File Patterns

### Enriched Types

Collection entries get enriched with computed fields before being passed to components:

```typescript
import { getCollection, type CollectionEntry } from "astro:content";

// Raw entry from collection
type RawProject = CollectionEntry<"projects">;

// Enriched type exported for use in components
export type Project = RawProject & {
  slug: string;
  // ...any additional computed fields
};

export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection("projects");
  return entries.map((entry) => ({
    ...entry,
    slug: entry.id,
    // ...compute derived fields
  }));
}
```

- Reference [`src/data/projects.ts`](../../src/data/projects.ts) for the canonical enriched-type pattern

### Config Merging

Data files merge `portfolio-config.json` (via `siteConfig`) with collection data:

```typescript
import { siteConfig } from "./siteConfig";
import { getCollection } from "astro:content";

export async function getCompanyProfiles() {
  const entries = await getCollection("companies");
  // merge entries with siteConfig.companies overrides
}
```

- `siteConfig` is the typed representation of `portfolio-config.json`
- Collection data takes precedence over config for content fields
- Config provides UI/display defaults (labels, nav, theme)

## Exports

Every `src/data/*.ts` file must export:
1. **Typed interfaces** for all data shapes used in components
2. **Helper functions** (async where collection access is needed)
3. No default exports — named exports only

## siteConfig

`src/data/siteConfig.ts` is the central typed interface for `portfolio-config.json`. When adding new config fields:

1. Add the field to `portfolio-config.json`
2. Update the interface in `siteConfig.ts`
3. Update `docs/CONFIG-SCHEMA.md` to document the new field

## Utilities

Shared utility functions go in `src/utils/`. Keep data files focused on data transformation, not string formatting or DOM utilities.
