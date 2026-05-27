// skillAtlas.ts: Evidence-weighted radar/skill-atlas data computed from projects.
// Pure derivation layer. No new dependencies. Used by /about/skill-atlas page
// and mirrored by the content editor preview endpoint.
import { siteConfig } from "./siteConfig";
import { getProjects, type Project } from "./projects";
import { parseProjectDateValue } from "./projectHelpers";

export interface SkillAtlasAxisOverride {
  label: string;
  group: string;
  weight?: number;
}

export interface SkillAtlasFrontmatter {
  title?: string;
  intro?: string;
  ctaLabel?: string;
  aliases?: SkillAtlasAxisOverride[];
}

export interface SkillAtlasEvidence {
  slug: string;
  title: string;
  organization?: string;
  status: Project["status"];
  contribution: number;
  matchedSkills: string[];
}

export interface SkillAtlasAxis {
  group: string;
  icon: string;
  rawScore: number;
  normalizedScore: number;
  projectCount: number;
  skills: string[];
  topEvidence: SkillAtlasEvidence[];
}

export interface SkillAtlasData {
  axes: SkillAtlasAxis[];
  unmappedSkills: Array<{ skill: string; count: number }>;
  totalProjectsAnalyzed: number;
  totalSkillsAnalyzed: number;
  generatedAt: string;
}

const STATUS_WEIGHT: Record<Project["status"], number> = {
  active: 1.5,
  completed: 1.0,
  archived: 0.5,
  concept: 0.4,
};

const FEATURED_BOOST = 2;
const HIGHLIGHT_BOOST_PER_ITEM = 0.1;
const HIGHLIGHT_BOOST_CAP = 1.3;
const RECENCY_HALF_LIFE_MONTHS = 36;

// Default keyword aliases. Each group's keywords are matched case-insensitively
// against the substrings of project skill strings. Overrides from about.md
// frontmatter (skillAtlas.aliases) extend or refine these.
const DEFAULT_GROUP_KEYWORDS: Record<string, string[]> = {
  "Technical Program Management": [
    "program",
    "roadmap",
    "risk",
    "stakeholder",
    "dependency",
    "okr",
    "kpi",
    "cross-functional",
    "cross functional",
    "planning",
    "schedule",
    "budget",
    "delivery",
    "project management",
  ],
  "Operations and Systems": [
    "operations",
    "ops ",
    "process",
    "automation",
    "infrastructure",
    "incident",
    "runbook",
    "change management",
    "workflow",
    "systems design",
    "logistics",
    "deployment",
    "migration",
    "cloud",
    "backend",
    "security",
  ],
  "Community and Event Leadership": [
    "community",
    "event",
    "governance",
    "moderation",
    "member",
    "fundraising",
    "meetup",
    "ceremon",
    "attendee",
    "organizer",
    "venue",
    "live event",
    "hosting",
  ],
  "Technology and Tools": [
    "bot",
    "api",
    "llm",
    "ai",
    "visualization",
    "static site",
    "automation design",
    "discord",
    "data ",
    "analytics",
    "integration",
    "tooling",
    "crm",
  ],
  "Leadership and Strategy": [
    "leadership",
    "coach",
    "strategic",
    "mission",
    "decision",
    "after action",
    "military",
    "command",
    "training",
    "policy",
    "protocol",
    "mentoring",
    "team building",
  ],
};

interface ResolvedAliases {
  byGroup: Map<string, string[]>;
  weighted: Array<{ pattern: string; group: string; weight: number }>;
}

function resolveAliases(frontmatter?: SkillAtlasFrontmatter): ResolvedAliases {
  const byGroup = new Map<string, string[]>();
  for (const [group, keywords] of Object.entries(DEFAULT_GROUP_KEYWORDS)) {
    byGroup.set(group, [...keywords]);
  }

  const weighted: ResolvedAliases["weighted"] = [];
  for (const override of frontmatter?.aliases ?? []) {
    const group = override.group?.trim();
    const label = override.label?.trim().toLowerCase();
    if (!group || !label) continue;
    const list = byGroup.get(group) ?? [];
    list.push(label);
    byGroup.set(group, list);
    if (override.weight && override.weight > 0 && override.weight !== 1) {
      weighted.push({ pattern: label, group, weight: override.weight });
    }
  }

  return { byGroup, weighted };
}

function matchSkillToGroups(
  skill: string,
  aliases: ResolvedAliases,
): Array<{ group: string; aliasWeight: number }> {
  const haystack = skill.toLowerCase();
  const matches: Array<{ group: string; aliasWeight: number }> = [];
  for (const [group, keywords] of aliases.byGroup.entries()) {
    for (const keyword of keywords) {
      if (haystack.includes(keyword)) {
        const override = aliases.weighted.find(
          (w) => w.group === group && haystack.includes(w.pattern),
        );
        matches.push({ group, aliasWeight: override?.weight ?? 1 });
        break;
      }
    }
  }
  return matches;
}

function computeRecencyBoost(project: Project, now: Date): number {
  if (project.status === "active") return 1.2;
  const dateStr = project.endedAt?.trim() ?? project.startedAt?.trim();
  if (!dateStr) return 0.9;
  const parsed = parseProjectDateValue(dateStr, "end");
  if (!parsed) return 0.9;
  const months =
    (now.getFullYear() - parsed.getFullYear()) * 12 +
    (now.getMonth() - parsed.getMonth());
  if (months <= 0) return 1.2;
  const decay = Math.pow(0.5, months / RECENCY_HALF_LIFE_MONTHS);
  return 0.6 + 0.6 * decay;
}

function computeProjectWeight(project: Project, now: Date): number {
  const statusWeight = STATUS_WEIGHT[project.status] ?? 1;
  const featuredBoost = project.featured ? FEATURED_BOOST : 1;
  const highlightCount = project.highlights?.length ?? 0;
  const highlightBoost = Math.min(
    1 + HIGHLIGHT_BOOST_PER_ITEM * highlightCount,
    HIGHLIGHT_BOOST_CAP,
  );
  const recencyBoost = computeRecencyBoost(project, now);
  return statusWeight * featuredBoost * highlightBoost * recencyBoost;
}

export function computeSkillAtlas(
  projects: Project[],
  frontmatter?: SkillAtlasFrontmatter,
): SkillAtlasData {
  const aliases = resolveAliases(frontmatter);
  const now = new Date();

  const axisAcc = new Map<
    string,
    {
      icon: string;
      raw: number;
      skills: Set<string>;
      evidence: Map<string, SkillAtlasEvidence>;
    }
  >();
  for (const group of siteConfig.skills.groups) {
    axisAcc.set(group.label, {
      icon: group.icon,
      raw: 0,
      skills: new Set(),
      evidence: new Map(),
    });
  }

  const unmappedCounts = new Map<string, number>();
  let totalSkillsAnalyzed = 0;

  for (const project of projects) {
    const projectSkills = project.skills ?? [];
    if (projectSkills.length === 0) continue;
    const baseWeight = computeProjectWeight(project, now);

    for (const skill of projectSkills) {
      const cleaned = skill.trim();
      if (!cleaned) continue;
      totalSkillsAnalyzed += 1;
      const matches = matchSkillToGroups(cleaned, aliases);

      if (matches.length === 0) {
        unmappedCounts.set(cleaned, (unmappedCounts.get(cleaned) ?? 0) + 1);
        continue;
      }

      const perGroupWeight = baseWeight / matches.length;
      for (const { group, aliasWeight } of matches) {
        const bucket = axisAcc.get(group);
        if (!bucket) continue;
        const contribution = perGroupWeight * aliasWeight;
        bucket.raw += contribution;
        bucket.skills.add(cleaned);
        const prior = bucket.evidence.get(project.slug);
        if (prior) {
          prior.contribution += contribution;
          if (!prior.matchedSkills.includes(cleaned)) {
            prior.matchedSkills.push(cleaned);
          }
        } else {
          bucket.evidence.set(project.slug, {
            slug: project.slug,
            title: project.title,
            organization: project.organization,
            status: project.status,
            contribution,
            matchedSkills: [cleaned],
          });
        }
      }
    }
  }

  const rawMax = Math.max(
    1,
    ...Array.from(axisAcc.values()).map((axis) => axis.raw),
  );

  const axes: SkillAtlasAxis[] = siteConfig.skills.groups.map((group) => {
    const bucket = axisAcc.get(group.label);
    if (!bucket) {
      return {
        group: group.label,
        icon: group.icon,
        rawScore: 0,
        normalizedScore: 0,
        projectCount: 0,
        skills: [],
        topEvidence: [],
      };
    }
    const topEvidence = Array.from(bucket.evidence.values())
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5);
    return {
      group: group.label,
      icon: group.icon,
      rawScore: Math.round(bucket.raw * 100) / 100,
      normalizedScore: Math.round((bucket.raw / rawMax) * 100),
      projectCount: bucket.evidence.size,
      skills: Array.from(bucket.skills).sort((a, b) => a.localeCompare(b)),
      topEvidence,
    };
  });

  const unmappedSkills = Array.from(unmappedCounts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));

  return {
    axes,
    unmappedSkills,
    totalProjectsAnalyzed: projects.length,
    totalSkillsAnalyzed,
    generatedAt: new Date().toISOString(),
  };
}

export async function getSkillAtlasData(
  frontmatter?: SkillAtlasFrontmatter,
): Promise<SkillAtlasData> {
  const projects = await getProjects();
  return computeSkillAtlas(projects, frontmatter);
}
