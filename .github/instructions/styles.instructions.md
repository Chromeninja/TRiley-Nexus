---
applyTo: "src/styles/**/*.css"
---
<!-- Last reviewed: 2026-05-06 — update when design tokens or font stack changes -->

# Styles Rules

Applies to all CSS files under `src/styles/`. The design token source of truth is the `:root` block in [`src/styles/global.css`](../../src/styles/global.css).

> Colors sync with `portfolio-config.json` theme section. Edit colors and fonts in `portfolio-config.json`, not directly in global.css, so end users of the template can customize via config.

## Design Token Reference

### Colors

```css
/* Backgrounds */
--color-bg: #040b19
--color-bg-secondary: #091327
--color-bg-card: #0c1830
--color-bg-card-hover: #12203b

/* Text */
--color-text: #d9e7ff
--color-text-muted: #91a4c7
--color-text-dim: #5d7398
--color-text-heading: #f4f8ff

/* Primary accent (electric blue) */
--color-primary: #57a6ff
--color-accent: #57a6ff
--color-accent-dim: rgba(87, 166, 255, 0.14)
--color-accent-glow: rgba(87, 166, 255, 0.28)

/* Secondary accent (cyan) */
--color-secondary: #22d3ee
--color-accent2: #22d3ee
--color-accent2-dim: rgba(34, 211, 238, 0.14)
--color-accent2-glow: rgba(34, 211, 238, 0.26)

/* Borders */
--color-border: rgba(87, 166, 255, 0.16)
--color-border-strong: rgba(87, 166, 255, 0.34)

/* Status */
--color-success: #4ade80
--color-warning: #fbbf24
--color-danger: #ef4444
```

### Typography

```css
--font-heading: "Sora", "Space Grotesk", sans-serif
--font-body: "Manrope", system-ui, sans-serif
--font-mono: "JetBrains Mono", "Fira Code", monospace
```

### Spacing

```css
--space-xs: 0.25rem    --space-sm: 0.5rem     --space-md: 1rem
--space-lg: 1.5rem     --space-xl: 2rem       --space-2xl: 3rem
--space-3xl: 4rem      --space-4xl: 6rem
```

### Layout

```css
--container-max: 1200px    --container-md: 900px    --container-sm: 680px
--nav-height: 64px
```

### Border Radius

```css
--radius-sm: 4px    --radius-md: 8px    --radius-lg: 12px    --radius-xl: 16px
```

### Shadows & Glows

```css
--glow-accent: 0 10px 30px rgba(87, 166, 255, 0.14)
--glow-accent-strong: 0 18px 44px rgba(87, 166, 255, 0.18)
--glow-accent2: 0 10px 28px rgba(34, 211, 238, 0.12)
--shadow-card: 0 14px 34px rgba(1, 8, 22, 0.34)
--shadow-card-hover: 0 24px 58px rgba(1, 8, 22, 0.46)
```

### Transitions

```css
--transition-fast: 150ms ease    --transition-base: 250ms ease    --transition-slow: 400ms ease
```

## Rules

- **Never hardcode colors or spacing** — always use `var(--token-name)`
- **Dark theme only** — no light mode unless explicitly requested
- **No Tailwind utilities** — this project uses CSS custom properties exclusively
- **No inline styles** — scoped `<style>` in components or global.css only
- **BEM naming** for any global utility classes added here: `.block__element--modifier`
- New global utility classes should be broadly applicable; component-specific styles belong in the component's scoped `<style>` block

## Adding New Tokens

When adding a new design token to global.css:

1. Add it to the `:root` block with a comment describing its purpose
2. Group it logically with related tokens
3. Update `docs/CUSTOMIZATION.md` if it's something a template user would want to change
4. If it maps to a `portfolio-config.json` value, add a comment noting the sync relationship
