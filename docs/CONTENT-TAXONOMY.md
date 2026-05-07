# Content Taxonomy and Writing Standards

Canonical standards for markdown content in:

- `src/content/projects/*.md`
- `src/content/companies/*.md`

Use this reference when adding or editing content so tags, summaries, and metadata stay consistent.

## Project Categories

Use one of these category values:

- `Military Operations`
- `Events & Community Operations`
- `Community Systems`
- `Consulting & Infrastructure`
- `Product & Game Development`
- `Production & Pipeline`
- `Ubisoft Platform Work`
- `VR & Experimental Tech`
- `Commerce & Community Operations`

## Tag Guidelines

Keep project tags at 4-6 entries and prefer concise noun phrases.

### Military and Operations

- `Air National Guard`
- `Joint Operations`
- `Air Traffic Control`
- `Airfield Operations`
- `Community Outreach`
- `Volunteer Service`

### Community and Events

- `Community Operations`
- `Event Operations`
- `Community Engagement`
- `Logistics Coordination`
- `Scheduling Systems`
- `Staffing Operations`

### Platform and Support

- `Support Operations`
- `Support Experience`
- `Systems Integration`
- `Quality Reporting`
- `Customer Support`
- `Automation`

### Production and Technical Delivery

- `Technical Production`
- `Workflow Design`
- `Delivery Coordination`
- `Production Operations`
- `Cloud Migration`
- `Backend Modernization`

### Discord and Community Systems

- `Discord Administration`
- `Discord Automation`
- `Governance Systems`
- `Moderation Systems`
- `Verification Systems`
- `Community Platform`

Avoid broad filler tags such as `Operations` when a more specific tag is available.

## Date Standards

Use string values in frontmatter:

- Preferred: `YYYY-MM` when month is known
- Fallback: `YYYY` when month is unknown

Examples:

- `startedAt: "2025-08"`
- `endedAt: "2025-09"`
- `startedAt: "2017"`

`timeframe` should be used for display labels only, not as a replacement for known start/end values.

## Summary Standards

### `summary`

- 1-2 sentences
- Lead with what you delivered and for whom
- Prefer active voice
- Avoid internal-only jargon

### `cardSummary`

- 1 sentence
- recruiter-scan friendly
- around 90-140 characters when practical
- highlight outcome and scope quickly

## Problem / Approach / Outcome

When present, keep these direct and parallel:

- `problem`: what was broken, slow, risky, or unclear
- `approach`: what you changed or built
- `outcome`: what improved

If exact metrics are unknown, use approximate but concrete language such as:

- `improved consistency across recurring events`
- `reduced manual moderation overhead`
- `increased issue-report quality`

## Company Profile Standards

Each company profile under `profiles` should maintain:

- concise `summary`
- clear `companyInfo`
- practical `myTimeInfo`
- `roleSummary`
- aligned `tenureStart` and `timelineRoles`

When possible, include:

- `longSummary` for context
- `achievements` with 2-3 concrete bullets

## Consistency Checklist

Before committing content edits:

1. Category matches canonical list.
2. Tags are specific and non-duplicative.
3. Dates are strings in `YYYY-MM` or `YYYY`.
4. `summary` and `cardSummary` are concise and recruiter-friendly.
5. Company timeline roles align with tenure dates.
