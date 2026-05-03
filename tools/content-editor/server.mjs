import { createServer } from "node:http";
import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(__dirname, "public");
const BACKUP_DIR = path.join(ROOT_DIR, ".content-editor-backups");
const PORT = Number.parseInt(process.env.CONTENT_EDITOR_PORT ?? "4387", 10);
const HOST = process.env.CONTENT_EDITOR_HOST ?? "127.0.0.1";

const CONTENT_BASE_DIR = path.join(ROOT_DIR, "src/content");
const ABOUT_FILE_PATH = "src/content/about/about.md";

const MEDIA_TARGETS = [
  { id: "projects", label: "Project Media", relativeDir: "public/media/projects" },
  { id: "companies", label: "Company Logos", relativeDir: "public/media/companies" },
  { id: "site", label: "Site Media", relativeDir: "public/media/site" },
  { id: "documents", label: "Documents", relativeDir: "public/documents" },
];

const TOKENS = new Map();
const TOKEN_TTL_MS = 10 * 60 * 1000;

// Fields handled explicitly by renderFrontmatterPreview — excluded from the fallback scalar table.
const RESERVED_FM_FIELDS = new Set([
  "title", "organization", "roleTitle", "status", "category",
  "startedAt", "endedAt", "summary", "cardSummary", "longSummary", "problem", "approach",
  "outcome", "skills", "tags", "metaDescription", "featured", "order", "color",
  "organizationUrl", "timeframe", "backgroundParagraphs", "thinkItems", "personalItems",
  "values", "profileMedia", "additionalMedia", "resume", "highlights", "achievements",
  "timelineRoles", "companyInfo", "myTimeInfo", "roleSummary",
]);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(text);
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function parseUrl(req) {
  const target = req.url ?? "/";
  return new URL(target, `http://${HOST}:${PORT}`);
}

async function serveStatic(url, res) {
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let content;
  try {
    content = await fs.readFile(filePath);
  } catch {
    sendText(res, 404, "Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === ".html"
      ? "text/html; charset=utf-8"
      : ext === ".css"
        ? "text/css; charset=utf-8"
        : ext === ".js"
          ? "application/javascript; charset=utf-8"
          : "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(content);
}

async function walkDirectory(dirPath, out) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(fullPath, out);
      continue;
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") {
      out.push(path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/"));
    }
  }
}

function slugToLabel(value) {
  return value
    .replace(/\.md$/i, "")
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function parseFrontmatter(rawContent) {
  if (!rawContent.startsWith("---\n")) return { title: undefined, organization: undefined };
  const endIndex = rawContent.indexOf("\n---", 4);
  if (endIndex === -1) return { title: undefined, organization: undefined };
  const frontmatter = rawContent.slice(4, endIndex);

  const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const organizationMatch = frontmatter.match(/^organization:\s*["']?(.+?)["']?\s*$/m);

  return {
    title: titleMatch?.[1]?.trim(),
    organization: organizationMatch?.[1]?.trim(),
  };
}

function splitFrontmatter(rawContent) {
  const normalized = String(rawContent ?? "");
  const startMatch = normalized.match(/^---\r?\n/);
  if (!startMatch) return { frontmatter: "", rawFm: "", body: normalized };

  const endMatch = normalized.slice(startMatch[0].length).match(/\r?\n---(\r?\n|$)/);
  if (!endMatch || endMatch.index === undefined) {
    return { frontmatter: "", rawFm: "", body: normalized };
  }

  const frontmatterEnd = startMatch[0].length + endMatch.index + endMatch[0].length;
  return {
    frontmatter: normalized.slice(0, frontmatterEnd),
    rawFm: normalized.slice(startMatch[0].length, startMatch[0].length + endMatch.index),
    body: normalized.slice(frontmatterEnd),
  };
}

/**
 * Parse simple YAML used in frontmatter into a plain object.
 * Handles: scalars, quoted strings, simple arrays, nested scalar objects,
 * and arrays of multi-key objects (e.g. thinkItems, personalItems).
 */
function parseFrontmatterYaml(rawFm) {
  const unq = (s) => String(s ?? "").replace(/^["']|["']$/g, "").trim();

  const result = {};
  const lines = rawFm.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    // Top-level key
    const topKey = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!topKey) { i += 1; continue; }

    const key = topKey[1];
    const rest = topKey[2].trim();

    if (rest === "[]") { result[key] = []; i += 1; continue; }
    if (rest) { result[key] = unq(rest); i += 1; continue; }

    // No inline value — scan continuation at indent >= 2
    i += 1;
    const items = [];       // scalar array items
    const nestedObj = {};   // single nested object (e.g. resume:, profileMedia:)
    let isNestedObj = false;

    while (i < lines.length) {
      const next = lines[i];
      if (!next.trim()) { i += 1; continue; }

      const indent = next.match(/^(\s*)/)[1].length;
      if (indent === 0) break; // back to top-level

      // List item that starts an object: "  - key: val"
      const objItem = next.match(/^\s+-\s+([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
      if (objItem) {
        const obj = { [objItem[1]]: unq(objItem[2]) };
        i += 1;
        // Consume additional properties of this object (deeper indent)
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

      // Plain scalar list item: "  - value"
      const scalarItem = next.match(/^\s+-\s+(.+)$/);
      if (scalarItem) {
        items.push(unq(scalarItem[1]));
        i += 1;
        continue;
      }

      // Nested scalar key (e.g. "  src: /foo" inside profileMedia:)
      const nested = next.match(/^\s+([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
      if (nested) {
        isNestedObj = true;
        nestedObj[nested[1]] = unq(nested[2]);
        i += 1;
        continue;
      }

      break;
    }

    if (isNestedObj) {
      result[key] = nestedObj;
    } else if (items.length > 0) {
      result[key] = items;
    }
  }

  return result;
}

function renderFrontmatterPreview(rawFm) {
  const fm = parseFrontmatterYaml(rawFm);
  const parts = [];

  if (fm.title) {
    parts.push(`<h2 class="fm-title">${escapeHtml(String(fm.title))}</h2>`);
  }

  // Org / role / status badges
  const badges = [];
  if (fm.organization) badges.push(`<span class="fm-badge fm-org">${escapeHtml(String(fm.organization))}</span>`);
  if (fm.roleTitle) badges.push(`<span class="fm-badge fm-role">${escapeHtml(String(fm.roleTitle))}</span>`);
  if (fm.status) badges.push(`<span class="fm-badge fm-status">${escapeHtml(String(fm.status))}</span>`);
  if (fm.category) badges.push(`<span class="fm-badge fm-cat">${escapeHtml(String(fm.category))}</span>`);
  if (badges.length) parts.push(`<div class="fm-badges">${badges.join("")}</div>`);

  // Dates
  if (fm.startedAt || fm.endedAt) {
    const dates = [fm.startedAt, fm.endedAt].filter(Boolean).map((d) => escapeHtml(String(d)));
    parts.push(`<p class="fm-dates">&#128197; ${dates.join(" — ")}</p>`);
  }

  // Primary summary
  const summaryText = fm.summary || fm.cardSummary || fm.longSummary;
  if (summaryText) {
    parts.push(`<p class="fm-summary">${escapeHtml(String(summaryText))}</p>`);
  }

  // About: metaDescription as summary if no other summary
  if (!summaryText && fm.metaDescription) {
    parts.push(`<p class="fm-summary">${escapeHtml(String(fm.metaDescription))}</p>`);
  }

  // About: backgroundParagraphs
  if (Array.isArray(fm.backgroundParagraphs) && fm.backgroundParagraphs.length) {
    parts.push(`<div class="fm-section"><strong>Background</strong>${fm.backgroundParagraphs.map((p) => `<p>${escapeHtml(String(typeof p === "string" ? p : JSON.stringify(p)))}</p>`).join("")}</div>`);
  }

  // About: thinkItems (array of {title, text})
  if (Array.isArray(fm.thinkItems) && fm.thinkItems.length) {
    const rows = fm.thinkItems
      .filter((item) => typeof item === "object" && item.title)
      .map((item) => `<div class="fm-think-item"><strong>${escapeHtml(String(item.title))}</strong><p>${escapeHtml(String(item.text ?? ""))}</p></div>`)
      .join("");
    if (rows) parts.push(`<div class="fm-section"><strong>How I Think</strong>${rows}</div>`);
  }

  // About: personalItems (array of {icon, title, body})
  if (Array.isArray(fm.personalItems) && fm.personalItems.length) {
    const rows = fm.personalItems
      .filter((item) => typeof item === "object" && item.title)
      .map((item) => `<div class="fm-personal-item"><span class="fm-personal-icon">${escapeHtml(String(item.icon ?? ""))}</span><div><strong>${escapeHtml(String(item.title))}</strong><p>${escapeHtml(String(item.body ?? ""))}</p></div></div>`)
      .join("");
    if (rows) parts.push(`<div class="fm-section"><strong>Personal</strong>${rows}</div>`);
  }

  // About: values list
  if (Array.isArray(fm.values) && fm.values.length) {
    const items = fm.values.map((v) => `<li>${escapeHtml(String(v))}</li>`).join("");
    parts.push(`<div class="fm-section"><strong>Values</strong><ul class="fm-values">${items}</ul></div>`);
  }

  // Problem / Approach / Outcome
  for (const field of ["problem", "approach", "outcome"]) {
    if (fm[field]) {
      const label = { problem: "Problem", approach: "Approach", outcome: "Outcome" }[field];
      parts.push(`<div class="fm-section"><strong>${label}</strong><p>${escapeHtml(String(fm[field]))}</p></div>`);
    }
  }

  // Skills + Tags chips
  for (const field of ["skills", "tags"]) {
    const val = fm[field];
    if (Array.isArray(val) && val.length && val.every((v) => typeof v === "string")) {
      parts.push(
        `<div class="fm-tags"><span class="fm-tag-label">${field === "skills" ? "Skills" : "Tags"}:</span>${val.map((t) => `<span class="fm-tag">${escapeHtml(t)}</span>`).join("")}</div>`,
      );
    }
  }

  // Remaining unreserved scalar fields
  const extras = Object.entries(fm)
    .filter(([k, v]) => !RESERVED_FM_FIELDS.has(k) && typeof v === "string" && v);
  if (extras.length) {
    const rows = extras
      .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
      .join("");
    parts.push(`<table class="fm-table">${rows}</table>`);
  }

  return parts.length
    ? `<div class="fm-preview">${parts.join("\n")}</div>`
    : `<p class="preview-note">No previewable content found.</p>`;
}

async function listMarkdownFiles() {
  const files = [];
  await walkDirectory(CONTENT_BASE_DIR, files);

  const entries = await Promise.all(
    files.map(async (filePath) => {
      const absolutePath = path.join(ROOT_DIR, filePath);
      const raw = await fs.readFile(absolutePath, "utf-8");
      const section = filePath.split("/")[2] ?? "content";
      const baseName = path.basename(filePath);
      const { title, organization } = parseFrontmatter(raw);

      return {
        id: createHash("sha1").update(filePath).digest("hex").slice(0, 16),
        path: filePath,
        section,
        label: title || slugToLabel(baseName),
        organization: organization || null,
      };
    }),
  );

  entries.sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section);

    if (a.section === "projects") {
      const orgA = a.organization || "Independent";
      const orgB = b.organization || "Independent";
      if (orgA !== orgB) return orgA.localeCompare(orgB);
    }

    return a.label.localeCompare(b.label);
  });

  return entries;
}

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, value] of TOKENS.entries()) {
    if (value.expiresAt < now) TOKENS.delete(token);
  }
}

function getAllowedAbsolutePath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.endsWith(".md")) {
    throw new Error("Only markdown files are supported.");
  }

  const normalized = relativePath.replace(/\\/g, "/");
  if (!normalized.startsWith("src/content/")) {
    throw new Error("Path is outside allowed content directories.");
  }

  const absolutePath = path.join(ROOT_DIR, normalized);
  if (!absolutePath.startsWith(CONTENT_BASE_DIR)) {
    throw new Error("Path traversal detected.");
  }

  return { normalized, absolutePath };
}

function validateMarkdownContent(content) {
  const errors = [];
  const warnings = [];

  if (typeof content !== "string") {
    errors.push("Content must be a string.");
    return { errors, warnings };
  }

  if (!content.trim()) errors.push("Markdown content cannot be empty.");
  if (!content.includes("---")) {
    warnings.push("No frontmatter delimiter found. Project files usually need frontmatter.");
  }

  return { errors, warnings };
}

function summarizeMarkdownChanges(before, after) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const maxLines = Math.max(beforeLines.length, afterLines.length);
  const changes = [];

  for (let index = 0; index < maxLines; index += 1) {
    const left = beforeLines[index];
    const right = afterLines[index];
    if (left === right) continue;

    changes.push({
      line: index + 1,
      before: left ?? "<missing>",
      after: right ?? "<missing>",
    });

    if (changes.length >= 300) break;
  }

  return changes;
}

function digestContent(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function writeMarkdown(relativePath, content) {
  const { normalized, absolutePath } = getAllowedAbsolutePath(relativePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `${normalized.replace(/[\\/]/g, "__")}.${timestamp}.md`;

  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const existing = await fs.readFile(absolutePath, "utf-8");
  await fs.writeFile(path.join(BACKUP_DIR, backupName), existing, "utf-8");

  const tmpPath = `${absolutePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpPath, content, "utf-8");
  await fs.rename(tmpPath, absolutePath);

  return path.relative(ROOT_DIR, path.join(BACKUP_DIR, backupName));
}

function sanitizeUploadName(name) {
  if (typeof name !== "string" || !name.trim()) throw new Error("File name is required.");
  const cleaned = name.trim().replace(/\s+/g, "-").replace(/[^A-Za-z0-9._-]/g, "");
  if (!cleaned || cleaned === "." || cleaned === "..") throw new Error("Invalid file name.");
  return cleaned;
}

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SAFE_HREF_RE = /^(https?:\/\/|mailto:|\/)./i;

function applyInlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const safeHref = SAFE_HREF_RE.test(href) ? escapeHtml(href) : "#";
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMarkdownToHtml(content) {
  const { body, rawFm } = splitFrontmatter(content);
  const normalizedBody = body.replace(/^\s+/, "");

  // Always render the frontmatter card when frontmatter is present
  const fmHtml = rawFm ? renderFrontmatterPreview(rawFm) : "";

  const bodyTrimmed = normalizedBody.trim();
  const renderBody = bodyTrimmed.length > 0;

  if (!fmHtml && !renderBody) {
    return '<p class="preview-note">No content yet.</p>';
  }

  if (!renderBody) return fmHtml;

  const lines = normalizedBody.split("\n");
  const html = [];
  let inList = false;
  let inCode = false;

  for (const line of lines) {
    if (line.startsWith("```") && !inCode) {
      inCode = true;
      html.push("<pre><code>");
      continue;
    }

    if (line.startsWith("```") && inCode) {
      inCode = false;
      html.push("</code></pre>");
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!line.trim()) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (/^\s*<[^>]+>/.test(line)) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(line);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      const level = headingMatch[1].length;
      html.push(`<h${level}>${applyInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    const listMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${applyInlineMarkdown(listMatch[1])}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    html.push(`<p>${applyInlineMarkdown(line)}</p>`);
  }

  if (inList) html.push("</ul>");
  if (inCode) html.push("</code></pre>");

  const bodyHtml = html.join("\n");
  return fmHtml
    ? `${fmHtml}\n<hr class="fm-divider">\n<div class="fm-body">${bodyHtml}</div>`
    : bodyHtml;
}

function quoteYamlString(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function createProjectFile(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const organization = typeof body.organization === "string" ? body.organization.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";

  if (!title) throw new Error("Project title is required.");
  if (!summary) throw new Error("Project summary is required.");

  const slugSource = typeof body.slug === "string" && body.slug.trim() ? body.slug : title;
  const slug = toSlug(slugSource);
  if (!slug) throw new Error("Unable to generate project slug.");

  const relativePath = `src/content/projects/${slug}.md`;
  const absolutePath = path.join(ROOT_DIR, relativePath);

  try {
    await fs.access(absolutePath);
    throw new Error("Project file already exists. Choose a different slug/title.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const content = `---
title: ${quoteYamlString(title)}
status: "active"
category: "Operations"
tags: []
organization: ${quoteYamlString(organization || "Independent")}
summary: ${quoteYamlString(summary)}
cardSummary: ${quoteYamlString(summary)}
highlights: []
problem: ""
approach: ""
outcome: ""
skills: []
tools: []
featured: false
order: 99
---

## Project Details

Describe project scope, execution, and outcomes.
`;

  await fs.writeFile(absolutePath, content, "utf-8");
  return { path: relativePath };
}

async function createCompanyFile(body) {
  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";

  if (!companyName) throw new Error("Company name is required.");

  const slugSource = typeof body.slug === "string" && body.slug.trim() ? body.slug : companyName;
  const slug = toSlug(slugSource);
  if (!slug) throw new Error("Unable to generate company slug.");

  const relativePath = `src/content/companies/${slug}.md`;
  const absolutePath = path.join(ROOT_DIR, relativePath);

  try {
    await fs.access(absolutePath);
    throw new Error("Company file already exists. Choose a different slug/name.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const content = `---
profiles:
  ${quoteYamlString(companyName)}:
    summary: ${quoteYamlString(summary || "Company summary")}
    companyInfo: ""
    myTimeInfo: ""
    longSummary: ""
    roleSummary: ""
    achievements: []
    color: "#57a6ff"
    tenureStart: ""
    tenureEnd: "Present"
    timelineRoles: []
---

Company profile override entry.
`;

  await fs.writeFile(absolutePath, content, "utf-8");
  return { path: relativePath };
}

async function appendAboutInfo(body) {
  const section = typeof body.section === "string" ? body.section : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) throw new Error("About text is required.");
  const allowedSections = new Set(["backgroundParagraphs", "values"]);
  if (!allowedSections.has(section)) throw new Error("Unsupported about section.");

  const aboutAbsolute = path.join(ROOT_DIR, ABOUT_FILE_PATH);
  const content = await fs.readFile(aboutAbsolute, "utf-8");
  const lines = content.split("\n");
  const sectionIndex = lines.findIndex((line) => line.trim() === `${section}:`);
  if (sectionIndex === -1) throw new Error(`Could not find ${section} in about file.`);

  let insertIndex = lines.length;
  for (let index = sectionIndex + 1; index < lines.length; index += 1) {
    if (/^[A-Za-z][A-Za-z0-9_]*:/.test(lines[index])) {
      insertIndex = index;
      break;
    }
  }

  lines.splice(insertIndex, 0, `  - ${quoteYamlString(text)}`);
  await fs.writeFile(aboutAbsolute, `${lines.join("\n")}\n`, "utf-8");
  return { path: ABOUT_FILE_PATH };
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/files") {
    try {
      const files = await listMarkdownFiles();
      sendJson(res, 200, { files, mediaTargets: MEDIA_TARGETS });
    } catch (error) {
      sendJson(res, 500, { error: `Failed to list files: ${error.message}` });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/file") {
    try {
      const relativePath = url.searchParams.get("path");
      const { normalized, absolutePath } = getAllowedAbsolutePath(relativePath);
      const content = await fs.readFile(absolutePath, "utf-8");
      sendJson(res, 200, { path: normalized, content });
    } catch (error) {
      sendJson(res, 400, { error: `Failed to read file: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/render") {
    try {
      const body = await parseJsonBody(req);
      sendJson(res, 200, { html: renderMarkdownToHtml(String(body.content ?? "")) });
    } catch (error) {
      sendJson(res, 400, { error: `Render failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/validate") {
    try {
      const body = await parseJsonBody(req);
      sendJson(res, 200, validateMarkdownContent(body.content));
    } catch (error) {
      sendJson(res, 400, { error: `Invalid request payload: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/preview") {
    try {
      cleanExpiredTokens();
      const body = await parseJsonBody(req);
      const { normalized, absolutePath } = getAllowedAbsolutePath(body.path);
      const validation = validateMarkdownContent(body.content);
      if (validation.errors.length > 0) {
        sendJson(res, 400, {
          error: "Validation failed.",
          errors: validation.errors,
          warnings: validation.warnings,
        });
        return;
      }

      const current = await fs.readFile(absolutePath, "utf-8");
      const changes = summarizeMarkdownChanges(current, body.content);
      const token = randomUUID();
      TOKENS.set(token, {
        path: normalized,
        digest: digestContent(body.content),
        expiresAt: Date.now() + TOKEN_TTL_MS,
      });

      sendJson(res, 200, {
        token,
        changeCount: changes.length,
        changes,
        warnings: validation.warnings,
      });
    } catch (error) {
      sendJson(res, 400, { error: `Preview failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/save") {
    try {
      cleanExpiredTokens();
      const body = await parseJsonBody(req);
      const tokenData = TOKENS.get(body.token);
      if (!tokenData || tokenData.path !== body.path) {
        sendJson(res, 400, { error: "Missing or expired preview token." });
        return;
      }

      if (tokenData.digest !== digestContent(body.content)) {
        sendJson(res, 400, {
          error: "Content changed after preview. Run preview again before saving.",
        });
        return;
      }

      const validation = validateMarkdownContent(body.content);
      if (validation.errors.length > 0) {
        sendJson(res, 400, {
          error: "Validation failed.",
          errors: validation.errors,
          warnings: validation.warnings,
        });
        return;
      }

      const backupFile = await writeMarkdown(body.path, body.content);
      TOKENS.delete(body.token);
      sendJson(res, 200, { saved: true, path: body.path, backupFile });
    } catch (error) {
      sendJson(res, 400, { error: `Save failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/create") {
    try {
      const body = await parseJsonBody(req);

      if (body.kind === "project") {
        sendJson(res, 200, await createProjectFile(body));
        return;
      }

      if (body.kind === "company") {
        sendJson(res, 200, await createCompanyFile(body));
        return;
      }

      if (body.kind === "about") {
        sendJson(res, 200, await appendAboutInfo(body));
        return;
      }

      sendJson(res, 400, { error: "Unknown create action." });
    } catch (error) {
      sendJson(res, 400, { error: `Create failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload") {
    try {
      const body = await parseJsonBody(req);
      const target = MEDIA_TARGETS.find((entry) => entry.id === body.targetId);
      if (!target) {
        sendJson(res, 400, { error: "Unknown media target." });
        return;
      }

      const safeName = sanitizeUploadName(body.fileName);
      if (typeof body.base64 !== "string" || !body.base64.trim()) {
        sendJson(res, 400, { error: "Missing base64 file content." });
        return;
      }

      const targetDir = path.join(ROOT_DIR, target.relativeDir);
      if (!targetDir.startsWith(ROOT_DIR)) {
        sendJson(res, 400, { error: "Invalid upload directory." });
        return;
      }

      await fs.mkdir(targetDir, { recursive: true });
      const filePath = path.join(targetDir, safeName);
      if (!filePath.startsWith(targetDir)) {
        sendJson(res, 400, { error: "Invalid upload path." });
        return;
      }

      await fs.writeFile(filePath, Buffer.from(body.base64, "base64"));
      const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
      sendJson(res, 200, {
        uploaded: true,
        relativePath,
        publicPath: `/${relativePath.replace(/^public\//, "")}`,
      });
    } catch (error) {
      sendJson(res, 400, { error: `Upload failed: ${error.message}` });
    }
    return;
  }

  sendJson(res, 404, { error: "API route not found." });
}

const server = createServer(async (req, res) => {
  try {
    const url = parseUrl(req);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(url, res);
  } catch (err) {
    console.error("[server] Unhandled request error:", err);
    if (!res.headersSent) sendJson(res, 500, { error: "Internal server error." });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Content editor running at http://${HOST}:${PORT}`);
});
