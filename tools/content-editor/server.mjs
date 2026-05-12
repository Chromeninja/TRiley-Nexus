import { createServer } from "node:http";
import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(__dirname, "public");
const SITE_PUBLIC_DIR = path.join(ROOT_DIR, "public");
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

// Fields handled explicitly by renderFrontmatterPreview: excluded from the fallback scalar table.
const RESERVED_FM_FIELDS = new Set([
  "title", "organization", "roleTitle", "status", "category",
  "startedAt", "endedAt", "summary", "cardSummary", "longSummary", "problem", "approach",
  "outcome", "skills", "tags", "metaDescription", "featured", "order", "color",
  "organizationUrl", "timeframe", "backgroundParagraphs", "thinkItems", "personalItems",
  "values", "profileMedia", "additionalMedia", "resume", "highlights", "achievements",
  "timelineRoles", "companyInfo", "myTimeInfo", "roleSummary",
]);

const FORM_SCHEMAS = {
  projects: [
    { key: "title", label: "Title", type: "text", required: true, placeholder: "Project title" },
    { key: "status", label: "Status", type: "select", required: true, options: ["active", "completed", "archived", "concept"] },
    { key: "category", label: "Category", type: "text", required: true, placeholder: "Project category" },
    { key: "organization", label: "Organization", type: "text", placeholder: "Company or team" },
    { key: "organizationUrl", label: "Organization URL", type: "text", placeholder: "https://example.com" },
    { key: "roleTitle", label: "Role Title", type: "text", placeholder: "Your role on this project" },
    { key: "timeframe", label: "Timeframe", type: "text", placeholder: "Ongoing or Jan 2024 - Mar 2025" },
    { key: "startedAt", label: "Started At", type: "text", placeholder: "Nov 2024" },
    { key: "endedAt", label: "Ended At", type: "text", placeholder: "Present" },
    { key: "summary", label: "Summary", type: "textarea", required: true, placeholder: "What was done and why it mattered." },
    { key: "cardSummary", label: "Card Summary", type: "textarea", placeholder: "Short version for cards/lists." },
    { key: "problem", label: "Problem", type: "textarea", placeholder: "What challenge existed?" },
    { key: "approach", label: "Approach", type: "textarea", placeholder: "How was the work executed?" },
    { key: "outcome", label: "Outcome", type: "textarea", placeholder: "What changed as a result?" },
    { key: "tags", label: "Tags", type: "list", placeholder: "One item per line or comma-separated" },
    { key: "skills", label: "Skills", type: "list", placeholder: "One item per line or comma-separated" },
    { key: "tools", label: "Tools", type: "list", placeholder: "One item per line or comma-separated" },
    { key: "highlights", label: "Highlights", type: "list", placeholder: "Up to 3 concise highlights" },
    { key: "featured", label: "Featured Project", type: "boolean" },
    { key: "order", label: "Sort Order", type: "number", placeholder: "Lower appears first" },
  ],
  about: [
    { key: "metaDescription", label: "Meta Description", type: "textarea", required: true, placeholder: "Short SEO/about summary." },
    { key: "backgroundParagraphs", label: "Background Paragraphs", type: "list", placeholder: "One paragraph per line" },
    { key: "values", label: "Values", type: "list", placeholder: "One value per line" },
    { key: "thinkItems", label: "Think Items", type: "textarea", placeholder: "Use one per line: Title::Text" },
    { key: "personalItems", label: "Personal Items", type: "textarea", placeholder: "Use one per line: Icon|Title|Body" },
  ],
  companies: [
    { key: "companyName", label: "Profile Name", type: "text", required: true, placeholder: "Must match project organization" },
    { key: "summary", label: "Summary", type: "textarea", required: true, placeholder: "Company summary used in timeline views." },
    { key: "companyInfo", label: "Company Info", type: "textarea", required: true, placeholder: "Company context and mission." },
    { key: "myTimeInfo", label: "My Time Info", type: "textarea", required: true, placeholder: "Your tenure narrative." },
    { key: "longSummary", label: "Long Summary", type: "textarea", placeholder: "Optional expanded summary." },
    { key: "roleSummary", label: "Role Summary", type: "textarea", placeholder: "Optional role-specific summary." },
    { key: "achievements", label: "Achievements", type: "list", placeholder: "One achievement per line" },
    { key: "logoSrc", label: "Logo Source", type: "text", placeholder: "/media/companies/company-logo.png" },
    { key: "logoAlt", label: "Logo Alt Text", type: "text", placeholder: "Accessible logo description" },
    { key: "color", label: "Brand Color", type: "text", placeholder: "#57a6ff" },
    { key: "tenureStart", label: "Tenure Start", type: "text", placeholder: "YYYY-MM or date label" },
    { key: "tenureEnd", label: "Tenure End", type: "text", placeholder: "Present or end date" },
    { key: "timelineRoles", label: "Timeline Roles", type: "textarea", placeholder: "Use one per line: Label|Start|End(optional)" },
  ],
};

function inferSectionFromPath(relativePath) {
  const normalized = String(relativePath ?? "").replace(/\\/g, "/");
  const section = normalized.split("/")[2] ?? "projects";
  return FORM_SCHEMAS[section] ? section : "projects";
}

function listSchemaKeys(section) {
  return new Set((FORM_SCHEMAS[section] ?? []).map((field) => field.key));
}

function parseArrayInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  const text = String(value ?? "");
  const separator = text.includes("\n") ? /\n/ : /,/;

  return text
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBooleanInput(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function toNumberOrUndefined(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function topLevelKeyBlocks(rawFm) {
  const lines = String(rawFm ?? "").split("\n");
  const blocks = [];
  let currentKey = null;
  let currentLines = [];

  for (const line of lines) {
    if (/^\s/.test(line)) {
      if (currentKey) currentLines.push(line);
      continue;
    }

    const keyMatch = line.match(/^(["'][^"']*["']|[^:]+?):\s*(.*)$/);
    if (keyMatch) {
      if (currentKey) {
        blocks.push({ key: currentKey, block: currentLines.join("\n") });
      }
      currentKey = keyMatch[1].trimEnd().replace(/^["'](.*)["']$/, "$1");
      currentLines = [line];
      continue;
    }

    if (currentKey) currentLines.push(line);
  }

  if (currentKey) {
    blocks.push({ key: currentKey, block: currentLines.join("\n") });
  }

  return blocks;
}

function isCompanyProfileObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const companyProfileKeys = new Set([
    "summary",
    "companyInfo",
    "myTimeInfo",
    "longSummary",
    "roleSummary",
    "achievements",
    "logo",
    "color",
    "tenureStart",
    "tenureEnd",
    "timelineRoles",
  ]);

  return Object.keys(value).some((key) => companyProfileKeys.has(key));
}

function getLegacyCompanyProfileEntries(parsedFrontmatter) {
  if (!parsedFrontmatter || typeof parsedFrontmatter !== "object") return [];

  return Object.entries(parsedFrontmatter).filter(
    ([key, value]) => key !== "profiles" && isCompanyProfileObject(value),
  );
}

function sanitizeUnknownFrontmatter(rawUnknown) {
  return String(rawUnknown ?? "")
    .split("\n")
    .filter((line) => line.trim() !== "---")
    .join("\n")
    .trim();
}

function scalarToYaml(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);

  const text = String(value ?? "");
  if (!text) return '""';
  if (/^(true|false|null|~|-?\d+(\.\d+)?)$/i.test(text)) {
    return quoteYamlString(text);
  }

  if (
    /[:#\n\-,]|^\s|\s$/.test(text)
    || text.includes("[")
    || text.includes("]")
    || text.includes("{")
    || text.includes("}")
  ) {
    return quoteYamlString(text);
  }

  return text;
}

function yamlKey(key) {
  const s = String(key ?? "");
  return /[\s:#"']/.test(s) ? quoteYamlString(s) : s;
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
          const rendered = [`${space}- ${yamlKey(firstKey)}: ${scalarToYaml(firstValue)}`];
          for (const [key, itemValue] of entries.slice(1)) {
            rendered.push(`${space}  ${yamlKey(key)}: ${scalarToYaml(itemValue)}`);
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
        if (child.length === 0) {
          out.push(`${space}${yamlKey(key)}: []`);
        } else {
          out.push(`${space}${yamlKey(key)}:`);
          out.push(serializeYaml(child, indent + 2));
        }
        continue;
      }

      if (child && typeof child === "object") {
        const childEntries = Object.entries(child).filter(([, v]) => v !== undefined);
        if (childEntries.length === 0) {
          out.push(`${space}${yamlKey(key)}: {}`);
        } else {
          out.push(`${space}${yamlKey(key)}:`);
          out.push(serializeYaml(child, indent + 2));
        }
        continue;
      }

      out.push(`${space}${yamlKey(key)}: ${scalarToYaml(child)}`);
    }

    return out.join("\n");
  }

  return `${space}${scalarToYaml(value)}`;
}

function parseLinesToObjects(text, expectedParts, delimiter = "|") {
  const rows = String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const out = [];
  for (const row of rows) {
    const parts = row.split(delimiter).map((part) => part.trim());
    if (parts.length < expectedParts.length) continue;

    const item = {};
    expectedParts.forEach((key, index) => {
      if (parts[index]) item[key] = parts[index];
    });
    out.push(item);
  }

  return out;
}

function objectsToLines(value, keys, delimiter = "|") {
  if (!Array.isArray(value)) return "";
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => keys.map((key) => String(item[key] ?? "").trim()).join(` ${delimiter} `).trim())
    .filter(Boolean)
    .join("\n");
}

function cloneJsonLike(value) {
  return JSON.parse(JSON.stringify(value));
}

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

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".avif") return "image/avif";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

async function serveStatic(url, res) {
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const editorFilePath = path.join(PUBLIC_DIR, pathname);
  const siteFilePath = path.join(SITE_PUBLIC_DIR, pathname);

  if (!editorFilePath.startsWith(PUBLIC_DIR) || !siteFilePath.startsWith(SITE_PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let content;
  let resolvedPath = editorFilePath;
  try {
    content = await fs.readFile(editorFilePath);
  } catch (editorError) {
    if (editorError?.code !== "ENOENT") {
      sendText(res, 500, "Failed to read file.");
      return;
    }

    try {
      content = await fs.readFile(siteFilePath);
      resolvedPath = siteFilePath;
    } catch (siteError) {
      if (siteError?.code === "ENOENT") {
        sendText(res, 404, "Not found");
        return;
      }

      sendText(res, 500, "Failed to read file.");
      return;
    }
  }

  const contentType = getContentType(resolvedPath);

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

async function walkFiles(dirPath, out) {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(fullPath, out);
      continue;
    }

    if (entry.isFile()) out.push(fullPath);
  }
}

function inferMediaKind(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"].includes(ext)) {
    return "image";
  }
  if ([".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv"].includes(ext)) {
    return "video";
  }
  if ([".pdf", ".doc", ".docx", ".txt", ".md"].includes(ext)) {
    return "document";
  }
  return "other";
}

async function listMediaFiles(targetId) {
  const target = MEDIA_TARGETS.find((entry) => entry.id === targetId);
  if (!target) {
    throw new Error("Unknown media target.");
  }

  const targetDir = path.join(ROOT_DIR, target.relativeDir);
  if (!targetDir.startsWith(ROOT_DIR)) {
    throw new Error("Invalid media target directory.");
  }

  const files = [];
  await walkFiles(targetDir, files);

  const items = await Promise.all(
    files.map(async (absolutePath) => {
      const stat = await fs.stat(absolutePath);
      const relativePath = path.relative(ROOT_DIR, absolutePath).replace(/\\/g, "/");
      return {
        fileName: path.basename(absolutePath),
        relativePath,
        publicPath: `/${relativePath.replace(/^public\//, "")}`,
        kind: inferMediaKind(absolutePath),
        sizeBytes: stat.size,
        updatedAt: stat.mtime.toISOString(),
      };
    }),
  );

  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return {
    target,
    items,
  };
}

function inferMediaKindFromSource(src, explicitType) {
  if (explicitType === "image" || explicitType === "video") return explicitType;
  const ext = path.extname(String(src ?? "")).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"].includes(ext)) {
    return "image";
  }
  if ([".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv"].includes(ext)) {
    return "video";
  }
  return "other";
}

function finalizeProjectMediaEntries(mediaItems) {
  const normalized = mediaItems
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const kind = inferMediaKindFromSource(entry.src, entry.type);
      if ((kind !== "image" && kind !== "video") || !entry.src) {
        return null;
      }

      if (kind === "video") {
        const videoEntry = {
          type: "video",
          src: String(entry.src ?? "").trim(),
        };
        const poster = String(entry.poster ?? "").trim();
        const caption = String(entry.caption ?? "").trim();
        if (poster) videoEntry.poster = poster;
        if (caption) videoEntry.caption = caption;
        return videoEntry;
      }

      const imageEntry = {
        type: "image",
        src: String(entry.src ?? "").trim(),
        alt: String(entry.alt ?? "").trim(),
        isCover: entry.isCover === true,
      };
      const caption = String(entry.caption ?? "").trim();
      if (caption) imageEntry.caption = caption;
      return imageEntry;
    })
    .filter((entry) => entry && entry.src);

  const firstMarkedCoverIndex = normalized.findIndex(
    (entry) => entry.type === "image" && entry.isCover === true,
  );
  const fallbackCoverIndex = normalized.findIndex((entry) => entry.type === "image");
  const coverIndex = firstMarkedCoverIndex >= 0 ? firstMarkedCoverIndex : fallbackCoverIndex;

  return normalized.map((entry, index) => {
    if (entry.type !== "image") {
      return entry;
    }

    const imageEntry = {
      type: "image",
      src: entry.src,
      alt: String(entry.alt ?? "").trim(),
    };

    const caption = String(entry.caption ?? "").trim();
    if (caption) imageEntry.caption = caption;
    if (coverIndex >= 0 && index === coverIndex) {
      imageEntry.isCover = true;
    }

    return imageEntry;
  });
}

function normalizeProjectMediaEntries(parsed, options = {}) {
  const migrateLegacyCover = options.migrateLegacyCover !== false;
  const mediaItems = Array.isArray(parsed?.media) ? parsed.media : [];
  let normalized = finalizeProjectMediaEntries(mediaItems);

  if (!migrateLegacyCover) {
    return normalized;
  }

  const legacyCover = parsed?.cover;
  const legacyCoverSrc = legacyCover && typeof legacyCover === "object"
    ? String(legacyCover.src ?? "").trim()
    : "";

  if (legacyCoverSrc) {
    const existingLegacyIndex = normalized.findIndex((entry) => entry.type === "image" && entry.src === legacyCoverSrc);
    if (existingLegacyIndex >= 0) {
      normalized[existingLegacyIndex] = {
        ...normalized[existingLegacyIndex],
        isCover: true,
      };
    } else {
      normalized = [
        {
          type: "image",
          src: legacyCoverSrc,
          alt: String(legacyCover.alt ?? parsed?.title ?? "Project cover image").trim(),
          isCover: true,
        },
        ...normalized,
      ];
    }
  }

  return finalizeProjectMediaEntries(normalized);
}

function serializeProjectMediaContent(content, transform) {
  const { rawFm, body } = splitFrontmatter(content);
  if (!rawFm.trim()) {
    throw new Error("Project file must contain frontmatter.");
  }

  const parsed = parseFrontmatterYaml(rawFm);
  const mediaItems = normalizeProjectMediaEntries(parsed, { migrateLegacyCover: true });
  const nextMediaItems = transform(cloneJsonLike(mediaItems));
  const finalizedMedia = finalizeProjectMediaEntries(nextMediaItems);

  if (finalizedMedia.length > 0) {
    parsed.media = finalizedMedia;
  } else {
    delete parsed.media;
  }
  delete parsed.cover;

  const serialized = serializeYaml(parsed);
  const normalizedBody = String(body ?? "");
  const bodyBlock = normalizedBody.startsWith("\n") ? normalizedBody : `\n${normalizedBody}`;
  return {
    content: `---\n${serialized}\n---${bodyBlock}`,
    media: finalizedMedia,
  };
}

function normalizePreviewItem(label, src, kind, extra = {}) {
  return {
    label,
    src: String(src ?? ""),
    kind: inferMediaKindFromSource(src, kind),
    ...extra,
  };
}

function collectConfiguredMediaPreview(relativePath, content) {
  const section = inferSectionFromPath(relativePath);
  const { rawFm } = splitFrontmatter(content);
  const parsed = parseFrontmatterYaml(rawFm);
  const items = [];

  if (section === "projects") {
    const projectMedia = normalizeProjectMediaEntries(parsed, { migrateLegacyCover: true });
    projectMedia.forEach((entry, index) => {
      items.push(
        normalizePreviewItem(entry.isCover ? "Cover" : `Media ${index + 1}`, entry.src, entry.type, {
          alt: entry.alt ?? "",
          caption: entry.caption ?? "",
          poster: entry.poster ?? "",
          isCover: entry.isCover === true,
          mediaIndex: index,
        }),
      );
    });
  }

  if (section === "companies") {
    const profiles = parsed.profiles && typeof parsed.profiles === "object" ? parsed.profiles : {};
    for (const [profileName, profileData] of Object.entries(profiles)) {
      if (!profileData || typeof profileData !== "object") continue;
      const logo = profileData.logo;
      if (logo && typeof logo === "object" && logo.src) {
        items.push(
          normalizePreviewItem(`${profileName} Logo`, logo.src, "image", {
            alt: logo.alt ?? profileName,
          }),
        );
      }
    }
  }

  if (section === "about") {
    const profileMedia = parsed.profileMedia;
    if (profileMedia && typeof profileMedia === "object" && profileMedia.src) {
      items.push(
        normalizePreviewItem("Profile Media", profileMedia.src, "image", {
          alt: profileMedia.alt ?? "",
          caption: profileMedia.caption ?? "",
        }),
      );
    }

    if (Array.isArray(parsed.additionalMedia)) {
      parsed.additionalMedia
        .filter((entry) => entry && typeof entry === "object" && entry.src)
        .forEach((entry, index) => {
          items.push(
            normalizePreviewItem(`Additional Media ${index + 1}`, entry.src, "image", {
              alt: entry.alt ?? "",
              caption: entry.caption ?? "",
            }),
          );
        });
    }
  }

  return { section, items };
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
 * Handles the subset used by this editor: scalars, nested objects,
 * arrays, and arrays of multi-key objects.
 */
function parseFrontmatterYaml(rawFm) {
  const lines = String(rawFm ?? "").split("\n");

  function stripQuotes(value) {
    return String(value ?? "").replace(/^["']|["']$/g, "").trim();
  }

  function parseScalar(value) {
    const text = stripQuotes(value);
    if (text === "true") return true;
    if (text === "false") return false;
    if (text === "null" || text === "~") return null;
    if (/^-?\d+$/.test(text)) return Number.parseInt(text, 10);
    if (/^-?\d+\.\d+$/.test(text)) return Number.parseFloat(text);
    return text;
  }

  function getIndent(line) {
    return line.match(/^(\s*)/)?.[1].length ?? 0;
  }

  function nextMeaningfulLineIndex(startIndex) {
    for (let index = startIndex; index < lines.length; index += 1) {
      if (lines[index].trim()) return index;
    }

    return -1;
  }

  function parseArrayItemObject(firstLineContent, startIndex, parentIndent) {
    const item = {};
    const inlineMatch = firstLineContent.match(/^(["'][^"']*["']|[^:]+?):\s*(.*)$/);
    let index = startIndex;

    if (inlineMatch) {
      const [, rawKey, rest] = inlineMatch;
      const key = rawKey.trimEnd().replace(/^["'](.*)["']$/, "$1");
      if (rest.trim()) {
        item[key] = parseScalar(rest);
      } else {
        const nextIndex = nextMeaningfulLineIndex(index + 1);
        if (nextIndex !== -1 && getIndent(lines[nextIndex]) > parentIndent) {
          const nested = parseBlock(nextIndex, getIndent(lines[nextIndex]));
          item[key] = nested.value;
          index = nested.nextIndex - 1;
        } else {
          item[key] = "";
        }
      }
    } else if (firstLineContent.trim()) {
      return { value: parseScalar(firstLineContent), nextIndex: startIndex + 1 };
    }

    index += 1;
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      const indent = getIndent(line);
      if (indent <= parentIndent) break;

      const trimmed = line.trim();
      if (trimmed.startsWith("- ")) break;

      const match = trimmed.match(/^(["'][^"']*["']|[^:]+?):\s*(.*)$/);
      if (!match) {
        index += 1;
        continue;
      }

      const [, rawKey, rest] = match;
      const key = rawKey.trimEnd().replace(/^["'](.*)["']$/, "$1");
      if (rest.trim()) {
        item[key] = parseScalar(rest);
        index += 1;
        continue;
      }

      const nextIndex = nextMeaningfulLineIndex(index + 1);
      if (nextIndex !== -1 && getIndent(lines[nextIndex]) > indent) {
        const nested = parseBlock(nextIndex, getIndent(lines[nextIndex]));
        item[key] = nested.value;
        index = nested.nextIndex;
        continue;
      }

      item[key] = "";
      index += 1;
    }

    return { value: item, nextIndex: index };
  }

  function parseBlock(startIndex, baseIndent) {
    const firstIndex = nextMeaningfulLineIndex(startIndex);
    if (firstIndex === -1) return { value: {}, nextIndex: lines.length };

    const firstLine = lines[firstIndex];
    if (getIndent(firstLine) < baseIndent) {
      return { value: {}, nextIndex: firstIndex };
    }

    if (firstLine.trim().startsWith("- ")) {
      const items = [];
      let index = firstIndex;

      while (index < lines.length) {
        const line = lines[index];
        if (!line.trim()) {
          index += 1;
          continue;
        }

        const indent = getIndent(line);
        if (indent < baseIndent) break;
        if (indent !== baseIndent || !line.trim().startsWith("- ")) break;

        const parsedItem = parseArrayItemObject(line.trim().slice(2), index, baseIndent);
        items.push(parsedItem.value);
        index = parsedItem.nextIndex;
      }

      return { value: items, nextIndex: index };
    }

    const object = {};
    let index = firstIndex;

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      const indent = getIndent(line);
      if (indent < baseIndent) break;
      if (indent !== baseIndent) {
        index += 1;
        continue;
      }

      const trimmed = line.trim();
      const match = trimmed.match(/^(["'][^"']*["']|[^:]+?):\s*(.*)$/);
      if (!match) {
        index += 1;
        continue;
      }

      const [, rawKey, rest] = match;
      const key = rawKey.trimEnd().replace(/^["'](.*)["']$/, "$1");
      if (rest.trim() === "[]") {
        object[key] = [];
        index += 1;
        continue;
      }

      if (rest.trim()) {
        object[key] = parseScalar(rest);
        index += 1;
        continue;
      }

      const nextIndex = nextMeaningfulLineIndex(index + 1);
      if (nextIndex !== -1 && getIndent(lines[nextIndex]) > indent) {
        const nested = parseBlock(nextIndex, getIndent(lines[nextIndex]));
        object[key] = nested.value;
        index = nested.nextIndex;
        continue;
      }

      object[key] = "";
      index += 1;
    }

    return { value: object, nextIndex: index };
  }

  return parseBlock(0, 0).value;
}

function getPrimaryCompanyProfile(parsedFrontmatter) {
  const profiles = parsedFrontmatter?.profiles;
  if (!profiles || typeof profiles !== "object") {
    const [legacyName, legacyProfile] = getLegacyCompanyProfileEntries(parsedFrontmatter)[0] ?? ["", null];
    if (!legacyProfile || typeof legacyProfile !== "object") {
      return { name: "", profile: null };
    }

    return { name: String(legacyName ?? ""), profile: legacyProfile };
  }

  const [name, profile] = Object.entries(profiles)[0] ?? ["", null];
  if (!profile || typeof profile !== "object") {
    return { name: String(name ?? ""), profile: null };
  }

  return { name: String(name ?? ""), profile };
}

function getCompanyFileMetadata(rawContent) {
  const { rawFm } = splitFrontmatter(rawContent);
  const parsed = parseFrontmatterYaml(rawFm);
  return getPrimaryCompanyProfile(parsed);
}

function createFormModel(relativePath, content) {
  const section = inferSectionFromPath(relativePath);
  const schema = FORM_SCHEMAS[section] ?? [];
  const { rawFm, body } = splitFrontmatter(content);
  const parsed = parseFrontmatterYaml(rawFm);

  const knownKeys = listSchemaKeys(section);
  if (section === "projects") {
    knownKeys.add("cover");
    knownKeys.add("links");
    knownKeys.add("media");
  }
  if (section === "about") {
    knownKeys.add("profileMedia");
    knownKeys.add("additionalMedia");
    knownKeys.add("resume");
  }
  if (section === "companies") {
    knownKeys.add("profiles");
  }

  const legacyCompanyProfileNames =
    section === "companies"
      ? new Set(getLegacyCompanyProfileEntries(parsed).map(([name]) => String(name ?? "")))
      : new Set();

  const unknownFrontmatter = topLevelKeyBlocks(rawFm)
    .filter((entry) => !knownKeys.has(entry.key) && !legacyCompanyProfileNames.has(entry.key))
    .map((entry) => entry.block)
    .join("\n")
    .trim();

  let values = {};
  let context = {};

  if (section === "projects") {
    values = {
      title: String(parsed.title ?? ""),
      status: String(parsed.status ?? "active"),
      category: String(parsed.category ?? "Operations"),
      organization: String(parsed.organization ?? ""),
      organizationUrl: String(parsed.organizationUrl ?? ""),
      roleTitle: String(parsed.roleTitle ?? ""),
      timeframe: String(parsed.timeframe ?? ""),
      startedAt: String(parsed.startedAt ?? ""),
      endedAt: String(parsed.endedAt ?? ""),
      summary: String(parsed.summary ?? ""),
      cardSummary: String(parsed.cardSummary ?? ""),
      problem: String(parsed.problem ?? ""),
      approach: String(parsed.approach ?? ""),
      outcome: String(parsed.outcome ?? ""),
      tags: Array.isArray(parsed.tags) ? parsed.tags.join("\n") : "",
      skills: Array.isArray(parsed.skills) ? parsed.skills.join("\n") : "",
      tools: Array.isArray(parsed.tools) ? parsed.tools.join("\n") : "",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.join("\n") : "",
      featured: parseBooleanInput(parsed.featured),
      order: parsed.order === undefined ? "" : String(parsed.order),
    };

    context = {
      preserved: {
        cover: parsed.cover,
        links: parsed.links,
        media: parsed.media,
      },
    };
  }

  if (section === "about") {
    values = {
      metaDescription: String(parsed.metaDescription ?? ""),
      backgroundParagraphs: Array.isArray(parsed.backgroundParagraphs)
        ? parsed.backgroundParagraphs.join("\n")
        : "",
      values: Array.isArray(parsed.values) ? parsed.values.join("\n") : "",
      thinkItems: objectsToLines(parsed.thinkItems, ["title", "text"], "::"),
      personalItems: objectsToLines(parsed.personalItems, ["icon", "title", "body"], "|"),
    };

    context = {
      preserved: {
        profileMedia: parsed.profileMedia,
        additionalMedia: parsed.additionalMedia,
        resume: parsed.resume,
      },
    };
  }

  if (section === "companies") {
    const profiles =
      parsed.profiles && typeof parsed.profiles === "object" ? cloneJsonLike(parsed.profiles) : {};
    for (const [profileName, legacyProfile] of getLegacyCompanyProfileEntries(parsed)) {
      if (!(profileName in profiles)) {
        profiles[profileName] = cloneJsonLike(legacyProfile);
      }
    }

    const profileEntries = Object.entries(profiles);
    const [activeName, profile = {}] = profileEntries[0] ?? ["", {}];

    values = {
      companyName: String(activeName ?? ""),
      summary: String(profile.summary ?? ""),
      companyInfo: String(profile.companyInfo ?? ""),
      myTimeInfo: String(profile.myTimeInfo ?? ""),
      longSummary: String(profile.longSummary ?? ""),
      roleSummary: String(profile.roleSummary ?? ""),
      achievements: Array.isArray(profile.achievements) ? profile.achievements.join("\n") : "",
      logoSrc: String(profile.logo?.src ?? ""),
      logoAlt: String(profile.logo?.alt ?? ""),
      color: String(profile.color ?? ""),
      tenureStart: String(profile.tenureStart ?? ""),
      tenureEnd: String(profile.tenureEnd ?? ""),
      timelineRoles: objectsToLines(profile.timelineRoles, ["label", "start", "end"], "|"),
    };

    context = {
      activeProfileName: activeName,
      preservedProfiles: profiles,
    };
  }

  return {
    section,
    schema,
    values,
    body: String(body ?? "").replace(/^\s+/, ""),
    unknownFrontmatter,
    context,
  };
}

function composeMarkdownFromForm(relativePath, values, body, unknownFrontmatter, context = {}) {
  const section = inferSectionFromPath(relativePath);
  const out = {};

  if (section === "projects") {
    out.title = String(values.title ?? "").trim() || "Untitled Project";
    out.status = String(values.status ?? "active").trim() || "active";
    out.category = String(values.category ?? "Operations").trim() || "Operations";

    const organization = String(values.organization ?? "").trim();
    if (organization) out.organization = organization;

    const organizationUrl = String(values.organizationUrl ?? "").trim();
    if (organizationUrl) out.organizationUrl = organizationUrl;

    const roleTitle = String(values.roleTitle ?? "").trim();
    if (roleTitle) out.roleTitle = roleTitle;

    const timeframe = String(values.timeframe ?? "").trim();
    if (timeframe) out.timeframe = timeframe;

    const startedAt = String(values.startedAt ?? "").trim();
    if (startedAt) out.startedAt = startedAt;

    const endedAt = String(values.endedAt ?? "").trim();
    if (endedAt) out.endedAt = endedAt;

    out.summary = String(values.summary ?? "").trim() || "Add project summary.";

    const cardSummary = String(values.cardSummary ?? "").trim();
    if (cardSummary) out.cardSummary = cardSummary;

    const highlights = parseArrayInput(values.highlights);
    if (highlights.length) out.highlights = highlights.slice(0, 3);

    const problem = String(values.problem ?? "").trim();
    if (problem) out.problem = problem;

    const approach = String(values.approach ?? "").trim();
    if (approach) out.approach = approach;

    const outcome = String(values.outcome ?? "").trim();
    if (outcome) out.outcome = outcome;

    const skills = parseArrayInput(values.skills);
    if (skills.length) out.skills = skills;

    const tools = parseArrayInput(values.tools);
    if (tools.length) out.tools = tools;

    out.tags = parseArrayInput(values.tags);

    const preserved = context.preserved && typeof context.preserved === "object" ? context.preserved : {};
    if (preserved.cover && typeof preserved.cover === "object") out.cover = preserved.cover;
    if (Array.isArray(preserved.links) && preserved.links.length) out.links = preserved.links;
    if (Array.isArray(preserved.media) && preserved.media.length) out.media = preserved.media;

    out.featured = parseBooleanInput(values.featured);
    const order = toNumberOrUndefined(values.order);
    if (order !== undefined) out.order = order;
  }

  if (section === "about") {
    out.metaDescription = String(values.metaDescription ?? "").trim() || "Add about meta description.";

    const backgroundParagraphs = parseArrayInput(values.backgroundParagraphs);
    out.backgroundParagraphs = backgroundParagraphs;

    const thinkItems = parseLinesToObjects(values.thinkItems, ["title", "text"], "::");
    out.thinkItems = thinkItems;

    const personalItems = parseLinesToObjects(values.personalItems, ["icon", "title", "body"], "|");
    out.personalItems = personalItems;

    const valueList = parseArrayInput(values.values);
    out.values = valueList;

    const preserved = context.preserved && typeof context.preserved === "object" ? context.preserved : {};
    if (preserved.profileMedia && typeof preserved.profileMedia === "object") out.profileMedia = preserved.profileMedia;
    if (Array.isArray(preserved.additionalMedia)) out.additionalMedia = preserved.additionalMedia;
    if (preserved.resume && typeof preserved.resume === "object") out.resume = preserved.resume;
  }

  if (section === "companies") {
    const profileName = String(values.companyName ?? "").trim() || "Organization";
    const preservedProfiles =
      context.preservedProfiles && typeof context.preservedProfiles === "object"
        ? cloneJsonLike(context.preservedProfiles)
        : {};

    const activeProfileName = String(context.activeProfileName ?? "").trim();
    const baseProfile =
      (activeProfileName && preservedProfiles[activeProfileName] && typeof preservedProfiles[activeProfileName] === "object")
        ? preservedProfiles[activeProfileName]
        : ((preservedProfiles[profileName] && typeof preservedProfiles[profileName] === "object") ? preservedProfiles[profileName] : {});

    if (activeProfileName && activeProfileName !== profileName) {
      delete preservedProfiles[activeProfileName];
    }

    const updatedProfile = {
      ...baseProfile,
      summary: String(values.summary ?? "").trim(),
      companyInfo: String(values.companyInfo ?? "").trim(),
      myTimeInfo: String(values.myTimeInfo ?? "").trim(),
    };

    const longSummary = String(values.longSummary ?? "").trim();
    if (longSummary) updatedProfile.longSummary = longSummary;
    else delete updatedProfile.longSummary;

    const roleSummary = String(values.roleSummary ?? "").trim();
    if (roleSummary) updatedProfile.roleSummary = roleSummary;
    else delete updatedProfile.roleSummary;

    const color = String(values.color ?? "").trim();
    if (color) updatedProfile.color = color;
    else delete updatedProfile.color;

    const tenureStart = String(values.tenureStart ?? "").trim();
    if (tenureStart) updatedProfile.tenureStart = tenureStart;
    else delete updatedProfile.tenureStart;

    const tenureEnd = String(values.tenureEnd ?? "").trim();
    if (tenureEnd) updatedProfile.tenureEnd = tenureEnd;
    else delete updatedProfile.tenureEnd;

    const achievements = parseArrayInput(values.achievements);
    if (achievements.length) updatedProfile.achievements = achievements;
    else delete updatedProfile.achievements;

    const logoSrc = String(values.logoSrc ?? "").trim();
    const logoAlt = String(values.logoAlt ?? "").trim();
    if (logoSrc) {
      updatedProfile.logo = {
        src: logoSrc,
        alt: logoAlt || `${profileName} logo`,
      };
    } else {
      delete updatedProfile.logo;
    }

    const timelineRoles = parseLinesToObjects(values.timelineRoles, ["label", "start", "end"], "|");
    if (timelineRoles.length) updatedProfile.timelineRoles = timelineRoles;
    else delete updatedProfile.timelineRoles;

    preservedProfiles[profileName] = updatedProfile;
    out.profiles = preservedProfiles;
  }

  const knownYaml = serializeYaml(out).trim();
  const unknownYaml = sanitizeUnknownFrontmatter(unknownFrontmatter);
  const mergedFrontmatter = [knownYaml, unknownYaml].filter(Boolean).join("\n");
  const normalizedBody = String(body ?? "").replace(/^\s+/, "");

  return `---\n${mergedFrontmatter}\n---\n\n${normalizedBody}`;
}

function renderFrontmatterPreview(rawFm) {
  const fm = parseFrontmatterYaml(rawFm);
  const parts = [];
  const { name: companyName, profile: companyProfile } = getPrimaryCompanyProfile(fm);

  if (companyProfile) {
    if (companyName) {
      parts.push(`<h2 class="fm-title">${escapeHtml(companyName)}</h2>`);
    }

    if (companyProfile.logo?.src) {
      const logoAlt = String(companyProfile.logo.alt ?? companyName ?? "Company logo");
      parts.push(
        `<div class="fm-section"><img class="media-library__preview" src="${escapeHtml(String(companyProfile.logo.src))}" alt="${escapeHtml(logoAlt)}"></div>`,
      );
    }

    if (companyProfile.summary) {
      parts.push(`<div class="fm-summary">${renderRichTextPreview(companyProfile.summary)}</div>`);
    }

    for (const [label, field] of [["Company Info", "companyInfo"], ["My Time Info", "myTimeInfo"], ["Role Summary", "roleSummary"], ["Long Summary", "longSummary"]]) {
      if (companyProfile[field]) {
        parts.push(`<div class="fm-section"><strong>${label}</strong><div class="fm-richtext">${renderRichTextPreview(companyProfile[field])}</div></div>`);
      }
    }

    if (Array.isArray(companyProfile.achievements) && companyProfile.achievements.length) {
      const items = companyProfile.achievements.map((item) => `<li>${escapeHtml(String(item))}</li>`).join("");
      parts.push(`<div class="fm-section"><strong>Achievements</strong><ul class="fm-values">${items}</ul></div>`);
    }

    if (Array.isArray(companyProfile.timelineRoles) && companyProfile.timelineRoles.length) {
      const rows = companyProfile.timelineRoles
        .filter((item) => item && typeof item === "object" && item.label)
        .map((item) => `<li>${escapeHtml(String(item.label))} (${[item.start, item.end].filter(Boolean).map((value) => escapeHtml(String(value))).join(" to ")})</li>`)
        .join("");
      if (rows) {
        parts.push(`<div class="fm-section"><strong>Timeline Roles</strong><ul class="fm-values">${rows}</ul></div>`);
      }
    }

    return `<div class="fm-preview">${parts.join("\n")}</div>`;
  }

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
    parts.push(`<p class="fm-dates">&#128197; ${dates.join(" to ")}</p>`);
  }

  // Primary summary
  const summaryText = fm.summary || fm.cardSummary || fm.longSummary;
  if (summaryText) {
    parts.push(`<div class="fm-summary">${renderRichTextPreview(summaryText)}</div>`);
  }

  // About: metaDescription as summary if no other summary
  if (!summaryText && fm.metaDescription) {
    parts.push(`<div class="fm-summary">${renderRichTextPreview(fm.metaDescription)}</div>`);
  }

  // About: backgroundParagraphs
  if (Array.isArray(fm.backgroundParagraphs) && fm.backgroundParagraphs.length) {
    parts.push(`<div class="fm-section"><strong>Background</strong>${fm.backgroundParagraphs.map((p) => `<div class="fm-richtext">${renderRichTextPreview(typeof p === "string" ? p : JSON.stringify(p))}</div>`).join("")}</div>`);
  }

  // About: thinkItems (array of {title, text})
  if (Array.isArray(fm.thinkItems) && fm.thinkItems.length) {
    const rows = fm.thinkItems
      .filter((item) => typeof item === "object" && item.title)
      .map((item) => `<div class="fm-think-item"><strong>${escapeHtml(String(item.title))}</strong><div class="fm-richtext">${renderRichTextPreview(item.text ?? "")}</div></div>`)
      .join("");
    if (rows) parts.push(`<div class="fm-section"><strong>How I Think</strong>${rows}</div>`);
  }

  // About: personalItems (array of {icon, title, body})
  if (Array.isArray(fm.personalItems) && fm.personalItems.length) {
    const rows = fm.personalItems
      .filter((item) => typeof item === "object" && item.title)
      .map((item) => `<div class="fm-personal-item"><span class="fm-personal-icon">${escapeHtml(String(item.icon ?? ""))}</span><div><strong>${escapeHtml(String(item.title))}</strong><div class="fm-richtext">${renderRichTextPreview(item.body ?? "")}</div></div></div>`)
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
      parts.push(`<div class="fm-section"><strong>${label}</strong><div class="fm-richtext">${renderRichTextPreview(fm[field])}</div></div>`);
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
      const { name: companyName } = section === "companies"
        ? getCompanyFileMetadata(raw)
        : { name: "" };

      return {
        id: createHash("sha1").update(filePath).digest("hex").slice(0, 16),
        path: filePath,
        section,
        label: title || companyName || slugToLabel(baseName),
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

function extensionFromMimeType(mimeType) {
  const value = String(mimeType ?? "").toLowerCase();
  if (value === "image/jpeg") return ".jpg";
  if (value === "image/png") return ".png";
  if (value === "image/webp") return ".webp";
  if (value === "image/gif") return ".gif";
  if (value === "image/svg+xml") return ".svg";
  if (value === "image/avif") return ".avif";
  if (value === "video/mp4") return ".mp4";
  if (value === "video/webm") return ".webm";
  if (value === "video/quicktime") return ".mov";
  if (value === "application/pdf") return ".pdf";
  return "";
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function getAllowedPublicAssetPath(publicPath) {
  const normalizedInput = String(publicPath ?? "").trim().replace(/\\/g, "/");
  if (!normalizedInput.startsWith("/")) {
    throw new Error("publicPath must start with '/'.");
  }

  const normalizedPath = path.posix.normalize(normalizedInput);
  const allowedRoots = ["/media/", "/documents/"];
  if (!allowedRoots.some((root) => normalizedPath.startsWith(root))) {
    throw new Error("Only files in /media or /documents can be deleted.");
  }

  const absolutePath = path.join(SITE_PUBLIC_DIR, normalizedPath.slice(1));
  if (!absolutePath.startsWith(SITE_PUBLIC_DIR)) {
    throw new Error("Path traversal detected.");
  }

  const relativePath = path.relative(ROOT_DIR, absolutePath).replace(/\\/g, "/");
  return {
    publicPath: normalizedPath,
    absolutePath,
    relativePath,
  };
}

async function deletePublicAsset(publicPath) {
  const resolved = getAllowedPublicAssetPath(publicPath);

  let stat;
  try {
    stat = await fs.stat(resolved.absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
        throw new Error("Media file not found.", { cause: error });
    }
    throw error;
  }

  if (!stat.isFile()) {
    throw new Error("Only files can be deleted.");
  }

  await fs.unlink(resolved.absolutePath);
  return resolved;
}

function unlinkConfiguredMedia(relativePath, content, publicPath) {
  const cleanedPublicPath = String(publicPath ?? "").trim();
  if (!cleanedPublicPath.startsWith("/")) {
    throw new Error("publicPath must start with '/'.");
  }

  const { rawFm, body } = splitFrontmatter(content);
  if (!rawFm.trim()) {
    return { content, removedCount: 0 };
  }

  const parsed = parseFrontmatterYaml(rawFm);
  let removedCount = 0;
  const section = inferSectionFromPath(relativePath);

  if (section === "projects") {
    const mediaItems = normalizeProjectMediaEntries(parsed, { migrateLegacyCover: true });
    const before = mediaItems.length;
    const filtered = mediaItems.filter(
      (entry) => String(entry.src ?? "").trim() !== cleanedPublicPath,
    );
    const diff = before - filtered.length;
    if (diff > 0) {
      removedCount += diff;
      if (filtered.length > 0) {
        parsed.media = finalizeProjectMediaEntries(filtered);
      } else {
        delete parsed.media;
      }
      delete parsed.cover;
    }
  }

  if (section === "about") {
    const profileMediaSrc = parsed?.profileMedia && typeof parsed.profileMedia === "object"
      ? String(parsed.profileMedia.src ?? "").trim()
      : "";
    if (profileMediaSrc === cleanedPublicPath) {
      delete parsed.profileMedia;
      removedCount += 1;
    }

    if (Array.isArray(parsed.additionalMedia)) {
      const before = parsed.additionalMedia.length;
      parsed.additionalMedia = parsed.additionalMedia.filter((entry) => {
        if (!entry || typeof entry !== "object") return true;
        return String(entry.src ?? "").trim() !== cleanedPublicPath;
      });

      const diff = before - parsed.additionalMedia.length;
      if (diff > 0) {
        removedCount += diff;
      }

      if (parsed.additionalMedia.length === 0) {
        delete parsed.additionalMedia;
      }
    }
  }

  if (section === "companies") {
    const profiles = parsed?.profiles;
    if (profiles && typeof profiles === "object") {
      for (const profileData of Object.values(profiles)) {
        if (!profileData || typeof profileData !== "object") continue;
        const logoSrc = profileData.logo && typeof profileData.logo === "object"
          ? String(profileData.logo.src ?? "").trim()
          : "";

        if (logoSrc === cleanedPublicPath) {
          delete profileData.logo;
          removedCount += 1;
        }
      }
    }
  }

  if (removedCount === 0) {
    return { content, removedCount };
  }

  const serialized = serializeYaml(parsed);
  const normalizedBody = String(body ?? "");
  const bodyBlock = normalizedBody.startsWith("\n") ? normalizedBody : `\n${normalizedBody}`;
  return {
    content: `---\n${serialized}\n---${bodyBlock}`,
    removedCount,
  };
}

async function resolveUniqueUploadName(targetDir, baseName, ext) {
  const safeBase = sanitizeUploadName(baseName).replace(/\.[^.]*$/, "");
  const safeExt = ext && ext.startsWith(".") ? ext.toLowerCase() : "";

  let candidate = `${safeBase}${safeExt}`;
  let suffix = 2;
  while (await fileExists(path.join(targetDir, candidate))) {
    candidate = `${safeBase}-${suffix}${safeExt}`;
    suffix += 1;
  }

  return candidate;
}

async function getProjectUploadNaming(activePath, originalFileName, mimeType, targetDir) {
  if (!activePath) return null;

  const { normalized, absolutePath } = getAllowedAbsolutePath(activePath);
  if (!normalized.startsWith("src/content/projects/")) return null;

  const projectSlug = toSlug(path.basename(normalized, path.extname(normalized)));
  if (!projectSlug) return null;

  const raw = await fs.readFile(absolutePath, "utf-8");
  const { rawFm } = splitFrontmatter(raw);
  const parsed = parseFrontmatterYaml(rawFm);
  const mediaKind = inferMediaKindFromSource(originalFileName, String(mimeType ?? "").startsWith("video/") ? "video" : "image");
  const mediaItems = normalizeProjectMediaEntries(parsed, { migrateLegacyCover: true });
  const hasCover = mediaItems.some((entry) => entry.type === "image" && entry.isCover === true);
  const role = !hasCover && mediaKind === "image" ? "cover" : "media";

  const originalExt = path.extname(String(originalFileName ?? "")).toLowerCase();
  const extension = originalExt || extensionFromMimeType(mimeType) || ".bin";
  const baseName = role === "cover" ? `${projectSlug}-cover` : `${projectSlug}-media`;
  const fileName = await resolveUniqueUploadName(targetDir, baseName, extension);

  return { fileName, role };
}

function linkUploadedProjectMedia(content, publicPath, mimeType) {
  const cleanedPublicPath = String(publicPath ?? "").trim();
  if (!cleanedPublicPath.startsWith("/")) {
    throw new Error("publicPath must start with '/'.");
  }

  const { rawFm, body } = splitFrontmatter(content);
  if (!rawFm.trim()) {
    throw new Error("Project file must contain frontmatter.");
  }

  const parsed = parseFrontmatterYaml(rawFm);
  const mediaKind = inferMediaKindFromSource(cleanedPublicPath, String(mimeType ?? "").startsWith("video/") ? "video" : "image");

  const mediaItems = normalizeProjectMediaEntries(parsed, { migrateLegacyCover: true });
  const existingIndex = mediaItems.findIndex((entry) => String(entry.src ?? "").trim() === cleanedPublicPath);
  const alreadyLinked = existingIndex >= 0;

  if (alreadyLinked) {
    const existingEntry = mediaItems[existingIndex];
    return {
      content,
      role: existingEntry?.isCover === true ? "cover" : "media",
      inserted: false,
    };
  }

  const entry =
    mediaKind === "video"
      ? { type: "video", src: cleanedPublicPath }
      : { type: "image", src: cleanedPublicPath, alt: String(parsed.title ?? "") };

  const hasCover = mediaItems.some((item) => item.type === "image" && item.isCover === true);
  const role = mediaKind === "image" && !hasCover ? "cover" : "media";
  if (role === "cover" && entry.type === "image") {
    entry.isCover = true;
  }

  parsed.media = finalizeProjectMediaEntries([...mediaItems, entry]);
  delete parsed.cover;
  const serialized = serializeYaml(parsed);
  const normalizedBody = String(body ?? "");
  const bodyBlock = normalizedBody.startsWith("\n") ? normalizedBody : `\n${normalizedBody}`;
  return {
    content: `---\n${serialized}\n---${bodyBlock}`,
    role,
    inserted: true,
  };
}

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SAFE_HREF_RE = /^(https?:\/\/|mailto:|\/)./i;

const PREVIEW_LIST_ITEM_PATTERN = /^(\s*)([-*•]|\d+\.)\s+(.+)$/;

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

function formatPreviewInline(text) {
  return applyInlineMarkdown(escapeHtml(String(text ?? "")));
}

function renderPreviewNodes(nodes) {
  return nodes
    .map((node) => {
      if (node.type === "paragraph") {
        return `<p>${formatPreviewInline(node.text)}</p>`;
      }

      return `<${node.listType}>${node.items
        .map((item) => `<li>${formatPreviewInline(item.text)}${renderPreviewNodes(item.children)}</li>`)
        .join("")}</${node.listType}>`;
    })
    .join("");
}

function renderRichTextPreview(value) {
  if (!value) return "";

  const lines = String(value).replace(/\r\n/g, "\n").trim().split("\n");
  const nodes = [];
  const listStack = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    nodes.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  const appendParagraphToCurrentListItem = (text) => {
    const currentList = listStack[listStack.length - 1];
    const currentItem = currentList?.items?.[currentList.items.length - 1];
    if (!currentItem) {
      nodes.push({ type: "paragraph", text });
      return;
    }

    const lastChild = currentItem.children[currentItem.children.length - 1];
    if (lastChild?.type === "paragraph") {
      lastChild.text = `${lastChild.text} ${text}`;
      return;
    }

    currentItem.children.push({ type: "paragraph", text });
  };

  const closeListFrame = () => {
    const frame = listStack.pop();
    if (!frame) return;

    const listNode = { type: "list", listType: frame.listType, items: frame.items };
    const parent = listStack[listStack.length - 1];
    if (parent) {
      parent.items[parent.items.length - 1].children.push(listNode);
      return;
    }

    nodes.push(listNode);
  };

  const closeListsToIndent = (indent) => {
    while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
      closeListFrame();
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      closeListsToIndent(-1);
      continue;
    }

    const listMatch = line.match(PREVIEW_LIST_ITEM_PATTERN);
    if (!listMatch) {
      if (listStack.length > 0) {
        appendParagraphToCurrentListItem(trimmed);
        continue;
      }

      closeListsToIndent(-1);
      paragraph.push(trimmed);
      continue;
    }

    flushParagraph();

    const indent = listMatch[1].replaceAll("\t", "  ").length;
    const listType = /\d+\./.test(listMatch[2]) ? "ol" : "ul";
    const content = listMatch[3];

    closeListsToIndent(indent);

    const current = listStack[listStack.length - 1];
    if (!current || indent > current.indent) {
      listStack.push({ listType, indent, items: [{ text: content, children: [] }] });
      continue;
    }

    if (current.listType !== listType) {
      closeListFrame();
      listStack.push({ listType, indent, items: [{ text: content, children: [] }] });
      continue;
    }

    current.items.push({ text: content, children: [] });
  }

  flushParagraph();
  while (listStack.length > 0) {
    closeListFrame();
  }

  return renderPreviewNodes(nodes);
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

  if (req.method === "GET" && url.pathname === "/api/media") {
    try {
      const targetId = String(url.searchParams.get("targetId") ?? "");
      if (!targetId) {
        sendJson(res, 400, { error: "targetId is required." });
        return;
      }

      sendJson(res, 200, await listMediaFiles(targetId));
    } catch (error) {
      sendJson(res, 400, { error: `Failed to list media: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/form-model") {
    try {
      const body = await parseJsonBody(req);

      let content = String(body.content ?? "");
      let relativePath = String(body.path ?? "");
      if (!content && relativePath) {
        const { normalized, absolutePath } = getAllowedAbsolutePath(relativePath);
        relativePath = normalized;
        content = await fs.readFile(absolutePath, "utf-8");
      }

      if (!relativePath) {
        sendJson(res, 400, { error: "Path is required to build form model." });
        return;
      }

      sendJson(res, 200, createFormModel(relativePath, content));
    } catch (error) {
      sendJson(res, 400, { error: `Form model failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/media-preview") {
    try {
      const body = await parseJsonBody(req);
      const relativePath = String(body.path ?? "");
      if (!relativePath) {
        sendJson(res, 400, { error: "Path is required to preview configured media." });
        return;
      }

      const content = String(body.content ?? "");
      if (!content) {
        sendJson(res, 200, {
          section: inferSectionFromPath(relativePath),
          items: [],
        });
        return;
      }

      sendJson(res, 200, collectConfiguredMediaPreview(relativePath, content));
    } catch (error) {
      sendJson(res, 400, { error: `Configured media preview failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/compose") {
    try {
      const body = await parseJsonBody(req);
      const relativePath = String(body.path ?? "");
      if (!relativePath) {
        sendJson(res, 400, { error: "Path is required to compose markdown." });
        return;
      }

      const content = composeMarkdownFromForm(
        relativePath,
        body.values ?? {},
        body.body ?? "",
        body.unknownFrontmatter ?? "",
        body.context ?? {},
      );

      const validation = validateMarkdownContent(content);
      sendJson(res, 200, {
        content,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    } catch (error) {
      sendJson(res, 400, { error: `Compose failed: ${error.message}` });
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

      const rawCurrent = await fs.readFile(absolutePath, "utf-8");
      let normalizedCurrent = rawCurrent;
      try {
        const formModel = createFormModel(normalized, rawCurrent);
        normalizedCurrent = composeMarkdownFromForm(
          normalized,
          formModel.values,
          formModel.body,
          formModel.unknownFrontmatter,
          formModel.context,
        );
      } catch {
        // fall back to raw content if normalization fails (e.g. malformed frontmatter)
      }
      const changes = summarizeMarkdownChanges(normalizedCurrent, body.content);
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

      // Skip write if content is semantically unchanged (same after normalization)
      const { absolutePath: saveAbsPath } = getAllowedAbsolutePath(body.path);
      const rawOnDisk = await fs.readFile(saveAbsPath, "utf-8");
      let normalizedOnDisk = rawOnDisk;
      try {
        const fm = createFormModel(body.path, rawOnDisk);
        normalizedOnDisk = composeMarkdownFromForm(
          body.path,
          fm.values,
          fm.body,
          fm.unknownFrontmatter,
          fm.context,
        );
      } catch {
        // fall back to raw if normalization fails
      }
      if (body.content === normalizedOnDisk) {
        TOKENS.delete(body.token);
        sendJson(res, 200, { saved: false, path: body.path, skipped: true });
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

      if (typeof body.base64 !== "string" || !body.base64.trim()) {
        sendJson(res, 400, { error: "Missing base64 file content." });
        return;
      }

      let fileName = body.fileName;
      let projectMediaRole = null;
      if (target.id === "companies" && body.activePath) {
        try {
          const { absolutePath } = getAllowedAbsolutePath(body.activePath);
          const raw = await fs.readFile(absolutePath, "utf8");
          const { name: profileName } = getCompanyFileMetadata(raw);
          if (profileName) {
            const ext = path.extname(body.fileName);
            fileName = `${toSlug(profileName)}-logo${ext}`;
          }
        } catch {
          // fall back to original filename
        }
      }

      const targetDir = path.join(ROOT_DIR, target.relativeDir);
      if (!targetDir.startsWith(ROOT_DIR)) {
        sendJson(res, 400, { error: "Invalid upload directory." });
        return;
      }

      if (target.id === "projects" && body.activePath) {
        try {
          const naming = await getProjectUploadNaming(
            body.activePath,
            body.fileName,
            body.mimeType,
            targetDir,
          );
          if (naming) {
            fileName = naming.fileName;
            projectMediaRole = naming.role;
          }
        } catch {
          // fall back to original filename
        }
      }

      const safeName = sanitizeUploadName(fileName);

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
        fileName: safeName,
        projectMediaRole,
      });
    } catch (error) {
      sendJson(res, 400, { error: `Upload failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/delete-media") {
    try {
      const body = await parseJsonBody(req);
      const publicPath = String(body.publicPath ?? "");
      if (!publicPath) {
        sendJson(res, 400, { error: "publicPath is required." });
        return;
      }

      const deleted = await deletePublicAsset(publicPath);
      sendJson(res, 200, {
        deleted: true,
        publicPath: deleted.publicPath,
        relativePath: deleted.relativePath,
      });
    } catch (error) {
      sendJson(res, 400, { error: `Delete media failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/unlink-media") {
    try {
      const body = await parseJsonBody(req);
      const relativePath = String(body.path ?? "");
      const content = String(body.content ?? "");
      const publicPath = String(body.publicPath ?? "");

      if (!relativePath) {
        sendJson(res, 400, { error: "Path is required." });
        return;
      }

      getAllowedAbsolutePath(relativePath);
      const unlinked = unlinkConfiguredMedia(relativePath, content, publicPath);
      sendJson(res, 200, unlinked);
    } catch (error) {
      sendJson(res, 400, { error: `Unlink media failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/link-project-media") {
    try {
      const body = await parseJsonBody(req);
      const relativePath = String(body.path ?? "");
      if (!relativePath) {
        sendJson(res, 400, { error: "Path is required." });
        return;
      }

      const { normalized } = getAllowedAbsolutePath(relativePath);
      if (!normalized.startsWith("src/content/projects/")) {
        sendJson(res, 400, { error: "Only project files can be linked to uploaded project media." });
        return;
      }

      const content = String(body.content ?? "");
      const publicPath = String(body.publicPath ?? "");
      const mimeType = String(body.mimeType ?? "");
      const linked = linkUploadedProjectMedia(content, publicPath, mimeType);

      sendJson(res, 200, linked);
    } catch (error) {
      sendJson(res, 400, { error: `Project media linking failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/set-project-cover") {
    try {
      const body = await parseJsonBody(req);
      const relativePath = String(body.path ?? "");
      if (!relativePath) {
        sendJson(res, 400, { error: "Path is required." });
        return;
      }

      const { normalized } = getAllowedAbsolutePath(relativePath);
      if (!normalized.startsWith("src/content/projects/")) {
        sendJson(res, 400, { error: "Only project files support cover media updates." });
        return;
      }

      const content = String(body.content ?? "");
      const mediaIndex = Number.parseInt(String(body.mediaIndex ?? ""), 10);
      if (!Number.isInteger(mediaIndex) || mediaIndex < 0) {
        sendJson(res, 400, { error: "mediaIndex must be a non-negative integer." });
        return;
      }

      const updated = serializeProjectMediaContent(content, (mediaItems) => {
        if (mediaItems.length === 0) {
          throw new Error("No project media is configured.");
        }

        if (mediaIndex >= mediaItems.length) {
          throw new Error("mediaIndex is out of range.");
        }

        if (mediaItems[mediaIndex]?.type !== "image") {
          throw new Error("Only image items can be marked as cover.");
        }

        return mediaItems.map((entry, index) => {
          if (entry.type !== "image") {
            return entry;
          }

          return {
            ...entry,
            isCover: index === mediaIndex,
          };
        });
      });

      sendJson(res, 200, updated);
    } catch (error) {
      sendJson(res, 400, { error: `Set project cover failed: ${error.message}` });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/reorder-project-media") {
    try {
      const body = await parseJsonBody(req);
      const relativePath = String(body.path ?? "");
      if (!relativePath) {
        sendJson(res, 400, { error: "Path is required." });
        return;
      }

      const { normalized } = getAllowedAbsolutePath(relativePath);
      if (!normalized.startsWith("src/content/projects/")) {
        sendJson(res, 400, { error: "Only project files support media reordering." });
        return;
      }

      if (!Array.isArray(body.order)) {
        sendJson(res, 400, { error: "order must be an array of media indexes." });
        return;
      }

      const content = String(body.content ?? "");
      const orderedIndexes = body.order.map((value) => Number.parseInt(String(value), 10));
      const hasInvalidIndex = orderedIndexes.some((value) => !Number.isInteger(value) || value < 0);
      if (hasInvalidIndex) {
        sendJson(res, 400, { error: "order contains invalid media indexes." });
        return;
      }

      const updated = serializeProjectMediaContent(content, (mediaItems) => {
        if (mediaItems.length === 0) {
          throw new Error("No project media is configured.");
        }

        if (orderedIndexes.length !== mediaItems.length) {
          throw new Error("order length must match the number of media items.");
        }

        const uniqueIndexes = new Set(orderedIndexes);
        if (uniqueIndexes.size !== mediaItems.length) {
          throw new Error("order must include each media index exactly once.");
        }

        const outOfRange = orderedIndexes.some((index) => index >= mediaItems.length);
        if (outOfRange) {
          throw new Error("order contains an index out of range.");
        }

        return orderedIndexes.map((index) => mediaItems[index]);
      });

      sendJson(res, 200, updated);
    } catch (error) {
      sendJson(res, 400, { error: `Reorder project media failed: ${error.message}` });
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
