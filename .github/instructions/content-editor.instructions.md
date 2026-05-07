---
applyTo: "tools/**"
---
<!-- Last reviewed: 2026-05-06; update when content editor endpoints or schemas change -->

# Content Editor Tools Rules

Applies to all files under `tools/`, primarily `tools/content-editor/server.mjs` and `tools/normalize-frontmatter.mjs`.

## Runtime Environment

- **Vanilla Node.js ESM** (`.mjs` extension, `"type": "module"` implied by extension)
- **No TypeScript**: plain JavaScript only
- **No bundler**: runs directly with `node`, no build step
- **No external framework**: native `http` module, not Express/Fastify
- Node ≥ 22.12.0 (matches Astro requirement)

## Security Model

The content editor is a **local-only development tool**. It runs on `localhost:4387` and is never deployed. Still, maintain these patterns:

- **Token-based auth**: 10-minute TTL tokens; all write endpoints verify token
- **Path traversal prevention**: validate and resolve all file paths against the allowed content root before any read/write operation; never trust client-supplied paths directly
- **Backup on write**: all frontmatter writes must create a backup in `.content-editor-backups/` before overwriting
- **No secrets in logs**: do not log token values

## File Write Pattern

```javascript
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join } from "path";

// Always resolve paths relative to project root, never trust raw client input
const CONTENT_ROOT = resolve(process.cwd(), "src/content");

function safePath(clientPath) {
  const resolved = resolve(CONTENT_ROOT, clientPath);
  if (!resolved.startsWith(CONTENT_ROOT)) {
    throw new Error("Path traversal attempt blocked");
  }
  return resolved;
}
```

## YAML Frontmatter Conventions

- **Zero-indent keys only are top-level**: nested objects use indented keys
- **Company profiles must be inside `profiles:`**: never as root-level keys in company files
- Legacy root-level company profile blocks must be merged into the `profiles` record on normalize
- Reference [`tools/normalize-frontmatter.mjs`](../../tools/normalize-frontmatter.mjs) for the normalization logic

```yaml
# ✅ Correct company frontmatter
profiles:
  company-slug:
    summary: "..."

# ❌ Wrong: root-level profile fields
summary: "..."
companyInfo: "..."
```

## Adding New Endpoints

When adding a new HTTP endpoint to `server.mjs`:

1. Parse and validate all input parameters before use
2. Require token verification on any endpoint that reads or writes files
3. Return consistent JSON responses: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
4. Add a note in `docs/LOCAL-DEVELOPMENT.md` if the endpoint changes the development workflow

## normalize-frontmatter.mjs

- CLI tool only: `npm run normalize-frontmatter [--write]`
- Dry-run by default: only writes when `--write` flag is passed
- Must not modify markdown body content: frontmatter YAML only
- Idempotent: running twice should produce the same output as running once
