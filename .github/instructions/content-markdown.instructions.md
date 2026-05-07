---
applyTo: "src/content/**/*.md"
---
<!-- Last reviewed: 2026-05-06; update when collection schemas change in src/content.config.ts -->

# Content Markdown Rules

Applies to all markdown files under `src/content/`. The canonical schema source is [`src/content.config.ts`](../../src/content.config.ts). Always consult it for field types, required/optional status, and enums.

> Prefer using the content editor UI (`npm run content-editor`, port 4387) for frontmatter edits. It provides form validation and auto-backup.

---

## projects Collection (`src/content/projects/*.md`)

### Required Fields

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Display name of the project/role |
| `status` | `"active" \| "completed" \| "archived" \| "concept"` | Current state |
| `category` | `string` | Grouping label (e.g. `"Military"`, `"Gaming"`) |
| `tags` | `string[]` | Searchable tags |
| `summary` | `string` | Full description (used on detail page) |
| `featured` | `boolean` | Whether to feature on homepage |

### Optional Fields

| Field | Type | Notes |
|---|---|---|
| `organization` | `string` | Company/org slug matching a companies entry |
| `organizationUrl` | `string` (URL) | External link |
| `roleTitle` | `string` | Job title or role name |
| `startedAt` | `string` | ISO-ish date string (e.g. `"2019-03"`) |
| `endedAt` | `string` | Omit if ongoing |
| `timeframe` | `string` | Human label (e.g. `"2019–2022"`) that overrides date display |
| `cardSummary` | `string` | Shorter summary for cards (falls back to `summary`) |
| `highlights` | `string[]` | Max 3 bullet-point highlights |
| `problem` | `string` | Problem statement |
| `approach` | `string` | How it was solved |
| `outcome` | `string` | Results / impact |
| `skills` | `string[]` | Skill labels used |
| `tools` | `string[]` | Tool/technology labels |
| `cover` | `{ src: string, alt: string }` | Hero image |
| `links` | `{ label: string, url: string }[]` | External links |
| `media` | See below | Gallery items |
| `order` | `number` | Sort order (integer) |

### media Array (Discriminated Union)

```yaml
media:
  - type: image
    src: /media/projects/my-project/screenshot.jpg
    alt: Dashboard screenshot
    caption: Optional caption    # optional

  - type: video
    src: /media/projects/my-project/demo.mp4
    poster: /media/projects/my-project/poster.jpg  # optional
    caption: Optional caption    # optional
```

### Minimal Valid Project Example

```yaml
---
title: "Project Name"
status: completed
category: "Category"
tags: ["tag1", "tag2"]
summary: "A one-paragraph summary of this project."
featured: false
---

Markdown body (optional extended content).
```

---

## companies Collection (`src/content/companies/*.md`)

All company data is namespaced under a `profiles` record keyed by company slug.

### profiles Record Schema

Each key in `profiles` maps to:

| Field | Type | Required |
|---|---|---|
| `summary` | `string` | ✅ |
| `companyInfo` | `string` | ✅ |
| `myTimeInfo` | `string` | ✅ |
| `longSummary` | `string` | optional |
| `roleSummary` | `string` | optional |
| `achievements` | `string[]` | optional |
| `logo` | `{ src: string, alt: string }` | optional |
| `color` | `string` | optional; CSS color for timeline accent |
| `tenureStart` | `string` | optional |
| `tenureEnd` | `string` | optional |
| `timelineRoles` | `{ label, start, end? }[]` | optional |

### Minimal Valid Companies Example

```yaml
---
profiles:
  company-slug:
    summary: "Short summary for cards."
    companyInfo: "About the company."
    myTimeInfo: "What I did there."
---
```

---

## about Collection (`src/content/about/*.md`)

Single file: `src/content/about/about.md`

| Field | Type | Required |
|---|---|---|
| `metaDescription` | `string` | ✅ |
| `backgroundParagraphs` | `string[]` | ✅ |
| `thinkItems` | `{ title, text }[]` | ✅ |
| `personalItems` | `{ icon, title, body }[]` | ✅ |
| `values` | `string[]` | ✅ |
| `profileMedia` | `{ src, alt, caption? } \| null` | optional |
| `additionalMedia` | `{ src, alt, caption? }[]` | optional |
| `resume` | `{ title, filePath, lastUpdated, summary? }` | optional |

---

## Media Path Conventions

- Project media: `public/media/projects/{project-slug}/`
- Company media: `public/media/companies/{company-slug}/`
- Site media: `public/media/site/`
- Documents: `public/documents/`
- Reference paths in frontmatter as root-relative: `/media/projects/my-slug/image.jpg`
