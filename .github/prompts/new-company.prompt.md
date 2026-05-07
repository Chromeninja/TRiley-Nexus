---
mode: "ask"
description: "Scaffold a new company entry in src/content/companies/"
---

# New Company Entry

Generate a new company markdown file for `src/content/companies/`.

Follow the schema in [`src/content.config.ts`](../../src/content.config.ts) and rules in [`.github/instructions/content-markdown.instructions.md`](./../instructions/content-markdown.instructions.md).

## Instructions for Copilot

Ask the user for the following, then generate the complete file:

1. **slug**: URL-safe filename and profile key (e.g. `my-company` → file: `src/content/companies/my-company.md`, profile key: `my-company`)
2. **summary**: One or two sentence card summary
3. **companyInfo**: Paragraph about the company itself
4. **myTimeInfo**: Paragraph about what the user did there
5. **longSummary**: Extended summary (optional)
6. **roleSummary**: Role-focused summary (optional)
7. **achievements**: Bullet list of achievements (optional)
8. **tenureStart / tenureEnd**: Date strings (e.g. `2019-03`), or leave blank
9. **color**: CSS color string for timeline accent (optional, e.g. `#57a6ff`)
10. **timelineRoles**: List of roles with start/end dates (optional)

## Output Format

Produce a complete `.md` file at `src/content/companies/{slug}.md`.

All fields must be nested inside the `profiles` record under the company slug key, never at the root level:

```md
---
profiles:
  {slug}:
    summary: "{summary}"
    companyInfo: >
      {companyInfo}
    myTimeInfo: >
      {myTimeInfo}
    longSummary: >
      {longSummary}               # omit if not provided
    roleSummary: "{roleSummary}"  # omit if not provided
    achievements:                 # omit if not provided
      - "{achievement 1}"
      - "{achievement 2}"
    tenureStart: "{tenureStart}"  # omit if not provided
    tenureEnd: "{tenureEnd}"      # omit if not provided
    color: "{color}"              # omit if not provided
    timelineRoles:                # omit if not provided
      - label: "{role label}"
        start: "{start}"
        end: "{end}"              # omit if current role
---
```

Leave the markdown body empty.
