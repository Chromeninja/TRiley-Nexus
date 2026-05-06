---
mode: "ask"
description: "Scaffold a new Astro component in src/components/"
---

# New Astro Component

Generate a new `.astro` component file for `src/components/`.

Follow the rules in [`.github/instructions/astro-components.instructions.md`](./../instructions/astro-components.instructions.md) and reference [`src/components/PageHero.astro`](../../src/components/PageHero.astro) as a structural template.

## Instructions for Copilot

Ask the user for the following, then generate the complete file:

1. **Component name** — PascalCase (e.g. `SkillBadge`, `ContactCard`)
2. **Purpose** — One sentence description of what it renders
3. **Props** — List of props with types and whether they're required (e.g. `label: string`, `count?: number`)
4. **Slots** — Does it use a default slot? Any named slots (e.g. `aside`, `meta`)?
5. **Data source** — Does it receive all data as props, or does it need to import from `src/data/`?
6. **JavaScript needed** — Any interactive behavior (click handlers, toggle state, etc.)?

## Output Format

Produce a complete `.astro` file at `src/components/{ComponentName}.astro`:

```astro
---
// Imports (Astro builtins → data layer → component → utils)

interface Props {
  // typed props based on user input
  // optional props use ?
  // provide defaults in destructuring
}

const { prop1, prop2 = defaultValue } = Astro.props;

// Any derived state or data fetching
---

<!-- Semantic HTML structure -->
<div class="{component-name}">
  <!-- conditional slot usage if slots were requested -->
  {Astro.slots.has("aside") && (
    <div class="{component-name}__aside">
      <slot name="aside" />
    </div>
  )}
  <slot />
</div>

<style>
  /* BEM naming: .component-name__element--modifier */
  /* CSS custom properties only — var(--token-name) */
  /* Responsive breakpoints inline here */
  .{component-name} {
    /* base styles */
  }
</style>
```

### Requirements to enforce in output

- `interface Props` block at the top of frontmatter
- All CSS in a scoped `<style>` block — no inline styles
- All color/spacing values use CSS custom properties from `src/styles/global.css`
- BEM class naming rooted at the kebab-case component name
- If JavaScript is needed: vanilla JS in a `<script>` block using `data-*` attribute hooks
- No `className`, `onClick`, or other framework-specific attributes
