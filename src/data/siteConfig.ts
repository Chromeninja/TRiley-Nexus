import fs from "node:fs";
import path from "node:path";

export interface SiteNavItem {
  href: string;
  label: string;
  enabled?: boolean;
}

export interface SocialConfig {
  githubUrl: string;
  linkedinUrl: string;
  email: string;
}

export interface CompanyTimelineRoleEntry {
  label: string;
  start: string;
  end?: string;
}

export interface CompanyProfile {
  summary: string;
  companyInfo: string;
  myTimeInfo: string;
  longSummary?: string;
  roleSummary?: string;
  achievements?: string[];
  logo?: {
    src: string;
    alt: string;
  };
  color?: string;
  tenureStart?: string;
  tenureEnd?: string;
  timelineRoles?: CompanyTimelineRoleEntry[];
}

export interface CareerAtlasEraDefinition {
  label: string;
  start: string;
  end: string;
  theme: string;
}

export interface ThemeConfig {
  colors: {
    [key: string]: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
}

export interface SiteConfig {
  site: {
    name: string;
    logoText: string;
    baseTitle: string;
    description: string;
    canonicalUrl: string;
    repository: {
      owner: string;
      name: string;
    };
    themeColor: string;
    ogImage: string;
  };
  navigation: SiteNavItem[];
  social: SocialConfig;
  footer: {
    tagline: string;
    focusLine: string;
  };
  home: {
    metaDescription: string;
    hero: {
      eyebrow: string;
      headlineLead: string;
      headlineAccent: string;
      headlineTail: string;
      subtext: string;
      supportingText: string;
      primaryAction: { label: string; href: string };
      secondaryAction: { label: string; href: string };
    };
    principles: Array<{ num: string; text: string }>;
    stats: Array<{ value: string; label: string }>;
  };
  about: {
    metaDescription: string;
    backgroundParagraphs: string[];
    thinkItems: Array<{ title: string; text: string }>;
    personalItems: Array<{ icon: string; title: string; body: string }>;
    values: string[];
    profileMedia: { src: string; alt: string; caption?: string } | null;
    additionalMedia: Array<{ src: string; alt: string; caption?: string }>;
    resume?: {
      title: string;
      filePath: string;
      lastUpdated: string;
      summary?: string;
    };
  };
  skills: {
    groups: Array<{ label: string; icon: string; skills: string[] }>;
    coreStrengths: Array<{ icon: string; title: string; description: string }>;
  };
  howIWork: {
    metaDescription: string;
    coreApproachParagraphs: string[];
    workPrinciples: Array<{ num: string; title: string; body: string }>;
    workStyleGroups: Array<{ icon: string; title: string; items: string[] }>;
    toolchainGroups: Array<{ category: string; tools: string[] }>;
    aar: {
      intro: string;
      questions: Array<{ q: string; sub: string }>;
    };
  };
  now: {
    metaDescription: string;
    lastUpdated: string;
    statusHeadline: string;
    statusValue: string;
    statusSupport: string;
    explorationItems: Array<{ icon: string; title: string; body: string }>;
    priorityItems: Array<{ label: string; text: string; color: string }>;
    openTo: { yes: string[]; no: string[] };
  };
  contact: {
    metaDescription: string;
    heroSubtitle: string;
    emailHint: string;
    linkedinHint: string;
    githubHint: string;
    responseTime: string;
    bestFor: string;
    notAFit: string;
    status: string;
    statusNote: string;
  };
  companies: Record<string, CompanyProfile>;
  careerEras: CareerAtlasEraDefinition[];
  theme: ThemeConfig;
}

function getDefaultConfigPath(): string {
  return path.resolve(process.cwd(), "portfolio-config.json");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasNonEmptyString(
  value: Record<string, unknown>,
  key: string,
): boolean {
  return typeof value[key] === "string" && value[key].trim().length > 0;
}

function assertConfigShape(config: unknown): asserts config is SiteConfig {
  if (!isRecord(config)) {
    throw new Error("portfolio-config.json must be a JSON object.");
  }

  const siteValue = config.site;
  if (!isRecord(siteValue)) {
    throw new Error(
      "portfolio-config.json is missing required site fields: site.name and site.repository.{owner,name}.",
    );
  }

  const repositoryValue = siteValue.repository;
  if (!isRecord(repositoryValue)) {
    throw new Error(
      "portfolio-config.json is missing required site fields: site.name and site.repository.{owner,name}.",
    );
  }

  if (
    !hasNonEmptyString(siteValue, "name") ||
    !hasNonEmptyString(repositoryValue, "name") ||
    !hasNonEmptyString(repositoryValue, "owner")
  ) {
    throw new Error(
      "portfolio-config.json is missing required site fields: site.name and site.repository.{owner,name}.",
    );
  }

  if (!Array.isArray(config.navigation) || config.navigation.length === 0) {
    throw new Error(
      "portfolio-config.json must include at least one navigation item.",
    );
  }
}

export function loadSiteConfig(
  configPath = getDefaultConfigPath(),
): SiteConfig {
  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  assertConfigShape(parsed);
  return parsed;
}

export const siteConfig = loadSiteConfig();

export const enabledNavItems = siteConfig.navigation.filter(
  (item) => item.enabled !== false,
);
