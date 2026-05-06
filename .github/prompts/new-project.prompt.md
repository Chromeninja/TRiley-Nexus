---
mode: "ask"
description: "Scaffold a new project entry in src/content/projects/"
---

# New Project Entry

Generate a new project markdown file for `src/content/projects/`.

Follow the schema in [`src/content.config.ts`](../../src/content.config.ts) and rules in [`.github/instructions/content-markdown.instructions.md`](./../instructions/content-markdown.instructions.md).

## Instructions for Copilot

Ask the user for the following, then generate the complete file:

1. **title** — Display name of the project or role
2. **slug** — URL-safe filename (e.g. `my-project-name` → file: `src/content/projects/my-project-name.md`)
3. **status** — One of: `active`, `completed`, `archived`, `concept`
4. **category** — Grouping label (e.g. `Military`, `Gaming`, `Consulting`)
5. **organization** — Company slug (must match a key in a companies collection file), or omit
6. **roleTitle** — Job title or role name (optional)
7. **startedAt / endedAt** — Date strings (e.g. `2021-06`), or leave blank if not known
8. **summary** — Full description paragraph
9. **cardSummary** — Shorter version for card display (optional, defaults to summary)
10. **problem / approach / outcome** — Three-part narrative (optional but encouraged)
11. **skills** — Comma-separated skill labels (optional)
12. **tags** — Comma-separated tags for search (required)
13. **featured** — `true` or `false`

## Output Format

Produce a complete `.md` file at `src/content/projects/{slug}.md`:

```md
---
title: "{title}"
status: {status}
category: "{category}"
tags: [{tags as quoted array}]
organization: "{organization}"    # omit line if not provided
roleTitle: "{roleTitle}"          # omit line if not provided
startedAt: "{startedAt}"          # omit line if not provided
endedAt: "{endedAt}"              # omit line if not provided
summary: >
  {summary}
cardSummary: "{cardSummary}"      # omit line if same as summary
problem: >
  {problem}                       # omit block if not provided
approach: >
  {approach}                      # omit block if not provided
outcome: >
  {outcome}                       # omit block if not provided
skills: [{skills as quoted array}]  # omit line if not provided
featured: {featured}
---
```

Leave the markdown body empty unless the user provides extended content.
