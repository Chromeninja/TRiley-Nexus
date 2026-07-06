/**
 * careerNarrative.ts
 * Career narrative data structure and aggregation.
 * Builds a narrative-focused view of career progression across companies.
 */

import {
  currentCompanyProfiles,
  setCurrentCompanyProfiles,
  getFallbackColor,
} from "./careerShared";
import { sortProjectsByOrderThenRecency } from "./projectsCore";
import { projectStatusLabels } from "./projectThemes";
import {
  getProjectOrganizationGroups,
  getRoleSegmentsFromProfile,
  inferRoleSegmentsFromProjects,
  mergeTimelineRanges,
} from "./careerTimeline";
import { formatProjectDateRange, toSlugId } from "./projectHelpers";
import { sanitizeCssColor } from "../utils/sanitizeCssColor";
import { getCompanyProfiles } from "./companyProfiles";
import type { Project } from "./projects";
import type { CompanyTimeline } from "./careerTimeline";

export interface CareerNarrativeProjectNode {
  id: string;
  slug: string;
  title: string;
  organization: string;
  category: string;
  roleTitle: string;
  summary: string;
  detailSummary: string;
  timeframeLabel: string;
  status: Project["status"];
  statusLabel: string;
  tags: string[];
  tools: string[];
  links: Array<{ label: string; url: string }>;
  mediaCount: number;
  isFeatured: boolean;
  isMajor: boolean;
  isLive: boolean;
  cover?: {
    src: string;
    alt: string;
  };
}

export interface CareerNarrativeCompanyNode {
  id: string;
  organization: string;
  summary: string;
  longSummary?: string;
  companyInfo?: string;
  myTimeInfo?: string;
  roleSummary: string;
  roles: string[];
  achievements: string[];
  rangeLabel: string;
  color: string;
  isActive: boolean;
  projectCount: number;
  featuredProjectCount: number;
  activeProjectCount: number;
  timeline?: CompanyTimeline;
  logo?: {
    src: string;
    alt: string;
  };
  projects: CareerNarrativeProjectNode[];
}

export interface CareerNarrativeData {
  rangeLabel: string;
  companies: CareerNarrativeCompanyNode[];
  companyCount: number;
  projectCount: number;
  activeCompanyCount: number;
  liveProjectCount: number;
}

interface DateRange {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  label: string;
}

function buildNarrativeProjectNode(
  project: Project,
  organization: string,
): CareerNarrativeProjectNode {
  const combinedTools = [
    ...new Set([...(project.tools ?? []), ...(project.skills ?? [])]),
  ];
  const detailSummary =
    [project.problem, project.approach, project.outcome]
      .find((entry) => entry?.trim())
      ?.trim() || project.summary;

  return {
    id: `project-${project.slug}`,
    slug: project.slug,
    title: project.title,
    organization,
    category: project.category,
    roleTitle: project.roleTitle?.trim() || "Project Contributor",
    summary: project.summary,
    detailSummary,
    timeframeLabel: formatProjectDateRange(project) || "Timeline not specified",
    status: project.status,
    statusLabel: projectStatusLabels[project.status],
    tags: project.tags.slice(0, 4),
    tools: combinedTools.slice(0, 5),
    links: project.links ?? [],
    mediaCount: project.media?.length ?? 0,
    isFeatured: Boolean(project.featured),
    isMajor:
      project.featured ||
      project.status === "active" ||
      (project.order ?? 99) <= 3,
    isLive: project.status === "active" || project.status === "concept",
    cover: project.cover,
  };
}

export async function getCareerNarrativeData(): Promise<CareerNarrativeData> {
  const companyProfiles = await getCompanyProfiles();
  setCurrentCompanyProfiles(companyProfiles);

  const groups = await getProjectOrganizationGroups();
  const referenceNow = new Date();

  const companies = groups
    .map((group) => {
      const profile = currentCompanyProfiles[group.organization] as
        | {
            summary?: string;
            longSummary?: string;
            companyInfo?: string;
            myTimeInfo?: string;
            roleSummary?: string;
            achievements?: string[];
            color?: string;
            logo?: { src: string; alt: string };
          }
        | undefined;
      const parsedRoles = getRoleSegmentsFromProfile(group.organization);
      const roleSegments =
        parsedRoles.length > 0
          ? parsedRoles
          : inferRoleSegmentsFromProjects(group.projects);
      const roles = roleSegments.map((segment) => segment.label);
      const narrativeProjects = [...group.projects]
        .sort((a, b) => sortProjectsByOrderThenRecency(a, b, referenceNow))
        .map((project) =>
          buildNarrativeProjectNode(project, group.organization),
        );
      const featuredProjectCount = narrativeProjects.filter(
        (project) => project.isFeatured,
      ).length;
      const activeProjectCount = narrativeProjects.filter(
        (project) => project.isLive,
      ).length;
      const color = sanitizeCssColor(
        profile?.color || getFallbackColor(group.organization),
      );

      return {
        id: `company-${toSlugId(group.organization)}`,
        organization: group.organization,
        summary:
          profile?.summary ||
          group.companySummary ||
          `${group.organization} work across operations, systems, and delivery.`,
        longSummary: profile?.longSummary,
        companyInfo: profile?.companyInfo,
        myTimeInfo: profile?.myTimeInfo,
        roleSummary:
          profile?.roleSummary ||
          roles.slice(0, 2).join(" / ") ||
          "Cross-functional systems work",
        roles,
        achievements: profile?.achievements ?? [],
        rangeLabel:
          group.timeline?.rangeLabel ||
          group.timeRangeLabel ||
          "Timeline not specified",
        color,
        isActive:
          group.timeline?.rangeEndLabel === "Present" || activeProjectCount > 0,
        projectCount: narrativeProjects.length,
        featuredProjectCount,
        activeProjectCount,
        timeline: group.timeline,
        logo: profile?.logo,
        projects: narrativeProjects,
      } as CareerNarrativeCompanyNode;
    })
    .sort((a, b) => {
      const aEnd = a.timeline?.rangeEnd.getTime() ?? 0;
      const bEnd = b.timeline?.rangeEnd.getTime() ?? 0;
      if (bEnd !== aEnd) {
        return bEnd - aEnd;
      }

      const aStart = a.timeline?.rangeStart.getTime() ?? 0;
      const bStart = b.timeline?.rangeStart.getTime() ?? 0;
      return bStart - aStart;
    });

  const projectCount = companies.reduce(
    (total, company) => total + company.projectCount,
    0,
  );
  const activeCompanyCount = companies.filter(
    (company) => company.isActive,
  ).length;
  const liveProjectCount = companies.reduce(
    (total, company) => total + company.activeProjectCount,
    0,
  );

  const narrativeRange = companies.reduce<DateRange | undefined>(
    (currentRange, company) => {
      const timeline = company.timeline;
      if (!timeline) {
        return currentRange;
      }

      const companyRange: DateRange = {
        start: timeline.rangeStart,
        end: timeline.rangeEnd,
        startLabel: timeline.rangeStartLabel,
        endLabel: timeline.rangeEndLabel,
        label: timeline.rangeLabel,
      };

      return mergeTimelineRanges([currentRange, companyRange]);
    },
    undefined,
  );

  return {
    rangeLabel: narrativeRange?.label || "Career timeline in progress",
    companies,
    companyCount: companies.length,
    projectCount,
    activeCompanyCount,
    liveProjectCount,
  };
}
