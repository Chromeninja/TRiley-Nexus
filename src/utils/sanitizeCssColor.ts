const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const CSS_VAR_RE = /^var\(--[a-zA-Z0-9_-]+\)$/;
const FUNCTION_COLOR_RE = /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([a-zA-Z0-9%.,\s/+-]+\)$/;
const NAMED_COLOR_RE = /^[a-zA-Z]+$/;

const FALLBACK_COLOR = "#5cc8ff";

export function sanitizeCssColor(value: unknown): string {
  if (typeof value !== "string") {
    return FALLBACK_COLOR;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return FALLBACK_COLOR;
  }

  if (
    HEX_COLOR_RE.test(trimmed) ||
    CSS_VAR_RE.test(trimmed) ||
    FUNCTION_COLOR_RE.test(trimmed) ||
    NAMED_COLOR_RE.test(trimmed)
  ) {
    return trimmed;
  }

  return FALLBACK_COLOR;
}
