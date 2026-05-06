---
applyTo: "src/components/**/*.astro"
---
<!-- Last reviewed: 2026-05-06 — update when new component patterns are added -->

# Astro Component Rules

Applies to all `.astro` files under `src/components/`.

## Props

Always declare a typed `interface Props` block at the top of the frontmatter:

```astro
---
interface Props {
  title: string;
  subtitle?: string;
  featured?: boolean;
}
const { title, subtitle, featured = false } = Astro.props;
---
```

- No `any` types — all props must be explicitly typed
- Use `?` for optional props; provide defaults in destructuring
- Export prop types when they may be reused: `export type { Props }`

## Slots

Check for slot presence before using conditional layouts:

```astro
{Astro.slots.has("aside") && (
  <div class="component__aside">
    <slot name="aside" />
  </div>
)}
```

- Named slots for secondary content regions (`aside`, `meta`, `footer`)
- Default `<slot />` for primary content
- Never assume a slot is filled — always guard with `Astro.slots.has()`

## CSS

All styles go in a scoped `<style>` block at the bottom of the file:

```astro
<style>
  .component-name {
    color: var(--color-text);
    padding: var(--space-md);
  }

  .component-name__element {
    font-family: var(--font-heading);
  }

  .component-name__element--modifier {
    color: var(--color-primary);
  }
</style>
```

- **BEM naming**: `.block__element--modifier`
- **CSS custom properties only** — never hardcode hex, rgb, or numeric spacing values
- All token values come from `src/styles/global.css` `:root` block
- Responsive breakpoints go inside the scoped `<style>` block, not global CSS
- Use `@media (max-width: 640px)` for mobile (consistent with existing components)

## JavaScript

Vanilla JS only in `<script>` blocks — no framework imports:

```astro
<script>
  const el = document.querySelector("[data-my-hook]");
  el?.addEventListener("click", () => { /* ... */ });
</script>
```

- Use `data-*` attributes as JS hooks, not CSS class names
- Do not add `client:*` directives — there are no interactive framework components in this project
- Keep scripts small and focused; extract shared utilities to `src/utils/`

## Naming & Structure Conventions

- File name: PascalCase matching the component purpose (`ProjectCard.astro`, `PageHero.astro`)
- Component class root matches file name in kebab-case: `ProjectCard.astro` → `.project-card`
- Import order: Astro builtins → data layer imports → component imports → utils
- Reference [`src/components/PageHero.astro`](../../src/components/PageHero.astro) as a structural template

## Accessibility

- All interactive elements need keyboard support and visible focus states
- Images require `alt` attributes (empty `alt=""` only for decorative images)
- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<article>`) appropriately
- Provide `aria-label` when element purpose is not clear from content alone
