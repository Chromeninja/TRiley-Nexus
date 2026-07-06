/**
 * careerAtlas.ts
 * Career atlas data structure and aggregation.
 * Builds a visual timeline of career eras, companies, and projects.
 */

import { siteConfig } from "./siteConfig";
import { parseProjectDateValue, toSlugId } from "./projectHelpers";
import { sanitizeCssColor } from "../utils/sanitizeCssColor";
import { getCompanyProfiles } from "./companyProfiles";
import {
  currentCompanyProfiles,
  setCurrentCompanyProfiles,
  getPresentDate,
  getFallbackColor,
} from "./careerShared";
import {
  getProjectOrganizationGroups,
  buildAxisYears,
  getProjectTimelineSegment,
  getRoleSegmentsFromProfile,
  inferRoleSegmentsFromProjects,
} from "./careerTimeline";
import type { Project } from "./projectsCore";
import type { CompanyTimeline } from "./careerTimeline";

export interface CareerAtlasProjectNode {
  id: string;
  slug: string;
  title: string;
  organization: string;
  roleTitle: string;
  summary: string;
  description?: string;
  outcomes: string[];
  tools: string[];
  links: Array<{ label: string; url: string }>;
  mediaCount: number;
  status: Project["status"];
  startedAt: string;
  endedAt: string;
  offsetPct: number;
  widthPct: number;
  isMajor: boolean;
  isLive: boolean;
}

export interface CareerAtlasCompanyNode {
  id: string;
  organization: string;
  color: string;
  summary: string;
  longSummary?: string;
  myTimeInfo?: string;
  rangeLabel: string;
  roleSummary: string;
  roles: string[];
  logo?: {
    src: string;
    alt: string;
  };
  achievements: string[];
  projectCount: number;
  offsetPct: number;
  widthPct: number;
  isActive: boolean;
  projects: CareerAtlasProjectNode[];
}

export interface CareerAtlasEra {
  id: string;
  label: string;
  theme: string;
  offsetPct: number;
  widthPct: number;
}

export interface CareerAtlasData {
  rangeStart: Date;
  rangeEnd: Date;
  rangeLabel: string;
  axisYears: number[];
  currentOffsetPct: number;
  eras: CareerAtlasEra[];
  companies: CareerAtlasCompanyNode[];
}

interface DateRange {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  label: string;
}

function toPositioning(
  start: Date,
  end: Date,
  range: DateRange,
): { offsetPct: number; widthPct: number } {
  const totalDurationMs = Math.max(
    range.end.getTime() - range.start.getTime(),
    1,
  );
  const rawOffset =
    ((range.end.getTime() - end.getTime()) / totalDurationMs) * 100;
  const rawWidth = ((end.getTime() - start.getTime()) / totalDurationMs) * 100;
  const offsetPct = Math.min(Math.max(rawOffset, 0), 100);
  const widthPct = Math.min(Math.max(rawWidth, 1.5), 100 - offsetPct);

  return { offsetPct, widthPct };
}

export async function getCareerAtlasData(): Promise<
  CareerAtlasData | undefined
> {
  const companyProfiles = await getCompanyProfiles();
  setCurrentCompanyProfiles(companyProfiles);

  const groups = await getProjectOrganizationGroups();
  const timelineGroups = groups.filter(
    (
      group,
    ): group is typeof groups[0] & { timeline: CompanyTimeline } =>
      Boolean(group.timeline),
  );

  if (timelineGroups.length === 0) {
    return undefined;
  }

  const atlasRange: DateRange = {
    start: timelineGroups.reduce(
      (earliest, current) =>
        current.timeline.rangeStart < earliest
          ? current.timeline.rangeStart
          : earliest,
      timelineGroups[0].timeline.rangeStart,
    ),
    end: timelineGroups.reduce(
      (latest, current) =>
        current.timeline.rangeEnd > latest ? current.timeline.rangeEnd : latest,
      timelineGroups[0].timeline.rangeEnd,
    ),
    startLabel: String(
      timelineGroups
        .reduce(
          (earliest, current) =>
            current.timeline.rangeStart < earliest
              ? current.timeline.rangeStart
              : earliest,
          timelineGroups[0].timeline.rangeStart,
        )
        .getFullYear(),
    ),
    endLabel: String(
      timelineGroups
        .reduce(
          (latest, current) =>
            current.timeline.rangeEnd > latest
              ? current.timeline.rangeEnd
              : latest,
          timelineGroups[0].timeline.rangeEnd,
        )
        .getFullYear(),
    ),
    label: "",
  };

  atlasRange.label = `${atlasRange.startLabel} - ${atlasRange.endLabel}`;

  const currentPosition = toPositioning(
    getPresentDate(),
    getPresentDate(),
    atlasRange,
  );
  const companies = timelineGroups
    .map((group) => {
      const profile = currentCompanyProfiles[group.organization] as
        | {
            roleSummary?: string;
            color?: string;
            summary?: string;
            longSummary?: string;
            myTimeInfo?: string;
            logo?: { src: string; alt: string };
            achievements?: string[];
          }
        | undefined;
      const companyPosition = toPositioning(
        group.timeline.rangeStart,
        group.timeline.rangeEnd,
        atlasRange,
      );
      const parsedRoles = getRoleSegmentsFromProfile(group.organization);
      const roleSegments =
        parsedRoles.length > 0
          ? parsedRoles
          : inferRoleSegmentsFromProjects(group.projects);
      const roles = roleSegments.map((segment) => segment.label);
      const roleSummary =
        profile?.roleSummary ||
        roles.slice(0, 2).join(" / ") ||
        "Cross-functional contributor";
      const color = sanitizeCssColor(
        profile?.color || getFallbackColor(group.organization),
      );

      const projects = group.projects
        .map((project) => {
          const segment = getProjectTimelineSegment(project);

          if (!segment) {
            return undefined;
          }

          const position = toPositioning(
            segment.start,
            segment.end,
            atlasRange,
          );
          const tools = [
            ...new Set([...(project.tools ?? []), ...(project.skills ?? [])]),
          ].slice(0, 6);
          const outcomes = [project.outcome, project.approach].filter(
            (entry): entry is string => Boolean(entry && entry.trim()),
          );

          return {
            id: `project-${project.slug}`,
            slug: project.slug,
            title: project.title,
            organization: group.organization,
            roleTitle: project.roleTitle?.trim() || "Project Contributor",
            summary: project.summary,
            description: project.problem,
            outcomes,
            tools,
            links: project.links ?? [],
            mediaCount: project.media?.length ?? 0,
            status: project.status,
            startedAt: segment.startLabel,
            endedAt: segment.endLabel,
            offsetPct: position.offsetPct,
            widthPct: position.widthPct,
            isMajor:
              project.featured ||
              project.status === "active" ||
              (project.order ?? 99) <= 3,
            isLive: segment.endLabel === "Present",
          } as CareerAtlasProjectNode;
        })
        .filter((project): project is CareerAtlasProjectNode =>
          Boolean(project),
        )
        .sort((a, b) => {
          const offsetDifference = a.offsetPct - b.offsetPct;
          if (offsetDifference !== 0) {
            return offsetDifference;
          }

          return a.title.localeCompare(b.title);
        });

      const isActive =
        group.timeline.rangeEndLabel === "Present" ||
        projects.some(
          (project) => project.isLive || project.status === "active",
        );

      return {
        id: `company-${toSlugId(group.organization)}`,
        organization: group.organization,
        color,
        summary: profile?.summary || group.companySummary || "",
        longSummary: profile?.longSummary || group.myTimeInfo,
        myTimeInfo: profile?.myTimeInfo,
        rangeLabel: group.timeline.rangeLabel,
        roleSummary,
        roles,
        logo: profile?.logo,
        achievements: profile?.achievements || [],
        projectCount: projects.length,
        offsetPct: companyPosition.offsetPct,
        widthPct: companyPosition.widthPct,
        isActive,
        projects,
      } as CareerAtlasCompanyNode;
    })
    .sort((a, b) => {
      const offsetDifference = a.offsetPct - b.offsetPct;
      if (offsetDifference !== 0) {
        return offsetDifference;
      }

      return a.organization.localeCompare(b.organization);
    });

  const eras = siteConfig.careerEras.map((era) => {
    const eraStart =
      parseProjectDateValue(era.start, "start") || atlasRange.start;
    const eraEnd = parseProjectDateValue(era.end, "end") || atlasRange.end;
    const boundedStart =
      eraStart < atlasRange.start ? atlasRange.start : eraStart;
    const boundedEnd = eraEnd > atlasRange.end ? atlasRange.end : eraEnd;
    const position = toPositioning(boundedStart, boundedEnd, atlasRange);

    return {
      id: `era-${toSlugId(era.label)}`,
      label: era.label,
      theme: era.theme,
      offsetPct: position.offsetPct,
      widthPct: position.widthPct,
    };
  });

  return {
    rangeStart: atlasRange.start,
    rangeEnd: atlasRange.end,
    rangeLabel: atlasRange.label,
    axisYears: buildAxisYears(atlasRange as Parameters<typeof buildAxisYears>[0]),
    currentOffsetPct: currentPosition.offsetPct,
    eras,
    companies,
  };
}
