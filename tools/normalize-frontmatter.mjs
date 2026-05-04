#!/usr/bin/env node
/**
 * normalize-frontmatter.mjs
 *
 * One-time (and repeatable) script that normalizes YAML frontmatter quoting
 * across all src/content MD files, using the same parse→serialize pipeline as
 * the content editor.  Only rewrites a file when the normalized output differs
 * from the current content.
 *
 * Usage:
 *   node tools/normalize-frontmatter.mjs          # dry-run (prints what would change)
 *   node tools/normalize-frontmatter.mjs --write  # applies changes
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT_DIR, "src/content");
const DRY_RUN = !process.argv.includes("--write");

// ---------------------------------------------------------------------------
// YAML helpers — identical to server.mjs
// ---------------------------------------------------------------------------

function quoteYamlString(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function scalarToYaml(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);

  const text = String(value ?? "");
  if (!text) return '""';
  if (/^(true|false|null|~|-?\d+(\.\d+)?)$/i.test(text)) return quoteYamlString(text);
  if (
    /[:#\n\-,]|^\s|\s$/.test(text) ||
    text.includes("[") || text.includes("]") ||
    text.includes("{") || text.includes("}")
  ) return quoteYamlString(text);
  return text;
}

function serializeYaml(value, indent = 0) {
  const space = " ".repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) return `${space}[]`;
    return value
      .map((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const entries = Object.entries(item);
          if (entries.length === 0) return `${space}- {}`;
          const [firstKey, firstValue] = entries[0];
          const rendered = [`${space}- ${firstKey}: ${scalarToYaml(firstValue)}`];
          for (const [key, itemValue] of entries.slice(1)) {
            rendered.push(`${space}  ${key}: ${scalarToYaml(itemValue)}`);
          }
          return rendered.join("\n");
        }
        return `${space}- ${scalarToYaml(item)}`;
      })
      .join("\n");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return `${space}{}`;
    const out = [];
    for (const [key, child] of entries) {
      if (child === undefined) continue;
      if (Array.isArray(child)) {
        if (child.length === 0) { out.push(`${space}${key}: []`); }
        else { out.push(`${space}${key}:`); out.push(serializeYaml(child, indent + 2)); }
        continue;
      }
      if (child && typeof child === "object") {
        const childEntries = Object.entries(child).filter(([, v]) => v !== undefined);
        if (childEntries.length === 0) { out.push(`${space}${key}: {}`); }
        else { out.push(`${space}${key}:`); out.push(serializeYaml(child, indent + 2)); }
        continue;
      }
      out.push(`${space}${key}: ${scalarToYaml(child)}`);
    }
    return out.join("\n");
  }

  return `${space}${scalarToYaml(value)}`;
}

function splitFrontmatter(rawContent) {
  const normalized = String(rawContent ?? "");
  const startMatch = normalized.match(/^---\r?\n/);
  if (!startMatch) return { rawFm: null, body: normalized };

  const endMatch = normalized.slice(startMatch[0].length).match(/\r?\n---(\r?\n|$)/);
  if (!endMatch || endMatch.index === undefined) return { rawFm: null, body: normalized };

  const startLen = startMatch[0].length;
  const rawFm = normalized.slice(startLen, startLen + endMatch.index);
  const body = normalized.slice(startLen + endMatch.index + endMatch[0].length);
  return { rawFm, body };
}

function parseFrontmatterYaml(rawFm) {
  const unq = (s) => String(s ?? "").replace(/^["']|["']$/g, "").trim();
  const result = {};
  const lines = rawFm.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    const topKey = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!topKey) { i += 1; continue; }

    const key = topKey[1];
    const rest = topKey[2].trim();

    if (rest === "[]") { result[key] = []; i += 1; continue; }
    if (rest) { result[key] = unq(rest); i += 1; continue; }

    i += 1;
    const items = [];
    const nestedObj = {};
    let isNestedObj = false;

    while (i < lines.length) {
      const next = lines[i];
      if (!next.trim()) { i += 1; continue; }

      const indent = next.match(/^(\s*)/)[1].length;
      if (indent === 0) break;

      const objItem = next.match(/^\s+-\s+([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
      if (objItem) {
        const obj = { [objItem[1]]: unq(objItem[2]) };
        i += 1;
        while (i < lines.length) {
          const prop = lines[i];
          if (!prop.trim()) { i += 1; continue; }
          const propIndent = prop.match(/^(\s*)/)[1].length;
          if (propIndent <= indent) break;
          const kv = prop.match(/^\s+([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
          if (kv) { obj[kv[1]] = unq(kv[2]); }
          i += 1;
        }
        items.push(obj);
        continue;
      }

      const scalarItem = next.match(/^\s+-\s+(.+)$/);
      if (scalarItem) { items.push(unq(scalarItem[1])); i += 1; continue; }

      const nested = next.match(/^\s+([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
      if (nested) { isNestedObj = true; nestedObj[nested[1]] = unq(nested[2]); i += 1; continue; }

      break;
    }

    if (isNestedObj) result[key] = nestedObj;
    else if (items.length > 0) result[key] = items;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Normalize a single file — parse FM, re-serialize, rebuild document
// ---------------------------------------------------------------------------

function normalizeContent(rawContent) {
  const { rawFm, body } = splitFrontmatter(rawContent);
  if (rawFm === null) return rawContent; // no frontmatter, leave untouched

  const parsed = parseFrontmatterYaml(rawFm);
  const serialized = serializeYaml(parsed).trim();
  const normalizedBody = String(body ?? "").replace(/^\s+/, "");

  return `---\n${serialized}\n---\n\n${normalizedBody}`;
}

// ---------------------------------------------------------------------------
// Walk src/content and process every .md file
// ---------------------------------------------------------------------------

async function findMdFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await findMdFiles(full)));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

async function main() {
  const files = await findMdFiles(CONTENT_DIR);
  let changed = 0;
  let skipped = 0;
  let errored = 0;

  for (const file of files) {
    const rel = path.relative(ROOT_DIR, file);
    try {
      const original = await fs.readFile(file, "utf-8");
      const normalized = normalizeContent(original);
      if (normalized === original) {
        skipped += 1;
        continue;
      }

      changed += 1;
      if (DRY_RUN) {
        console.log(`[would change] ${rel}`);
      } else {
        await fs.writeFile(file, normalized, "utf-8");
        console.log(`[normalized]   ${rel}`);
      }
    } catch (err) {
      errored += 1;
      console.error(`[error]        ${rel}: ${err.message}`);
    }
  }

  console.log(
    `\nDone. ${changed} file(s) ${DRY_RUN ? "would be" : "were"} normalized, ` +
    `${skipped} already clean, ${errored} error(s).`
  );
  if (DRY_RUN && changed > 0) {
    console.log('\nRun with --write to apply changes.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
