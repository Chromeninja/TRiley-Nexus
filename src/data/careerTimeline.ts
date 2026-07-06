/**
 * careerTimeline.ts
 * Timeline visualization and company/project organization data.
 * Provides company timelines, life timeline entries, and grouped projects by organization.
 */

import { getCompanyProfiles } from "./companyProfiles";
import {
  currentCompanyProfiles,
  setCurrentCompanyProfiles,
  getPresentDate,
} from "./careerShared";
import { parseProjectDateValue, rangeLengthInMonths } from "./projectHelpers";
import {
  getProjects,
  sortProjectsByOrderThenRecency,
  type Project,
} from "./projectsCore";

interface DateRange {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  label: string;
}

interface ParsedTimelineSegment {
  label: string;
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  kind: "role" | "project";
  status?: Project["status"];
  slug?: string;
}

export interface TimelineMonthGroup {
  key: string;
  month: number;
  monthLabel: string;
  projects: Project[];
}

export interface TimelineYearGroup {
  year: number;
  key: string;
  months: TimelineMonthGroup[];
}

export interface TimelineSegment {
  label: string;
  startLabel: string;
  endLabel: string;
  offsetPct: number;
  widthPct: number;
  kind: "role" | "project";
  status?: Project["status"];
  slug?: string;
}

export interface CompanyTimeline {
  organization: string;
  rangeStart: Date;
  rangeEnd: Date;
  rangeStartLabel: string;
  rangeEndLabel: string;
  rangeLabel: string;
  axisYears: number[];
  roleSegments: TimelineSegment[];
  projectSegments: TimelineSegment[];
}

export interface LifeTimelineEntry {
  organization: string;
  rangeStart: Date;
  rangeEnd: Date;
  rangeLabel: string;
  roleHighlights: string[];
  projectCount: number;
  projectHighlights: string[];
}

export interface ProjectOrganizationGroup {
  organization: string;
  projects: Project[];
  companySummary?: string;
  companyInfo?: string;
  myTimeInfo?: string;
  timeRangeLabel?: string;
  timeline?: CompanyTimeline;
}

function getProjectDateRange(projects: Project[]): DateRange | undefined {
  const startCandidates = projects
    .map((project) => project.startedAt?.trim())
    .filter((value): value is string => Boolean(value));
  const parsedStarts = startCandidates
    .map((value) => ({ value, parsed: parseProjectDateValue(value, "start") }))
    .filter((entry): entry is { value: string; parsed: Date } =>
      Boolean(entry.parsed),
    );

  if (parsedStarts.length === 0) {
    return undefined;
  }

  const earliestStart = parsedStarts.reduce((currentEarliest, current) =>
    current.parsed < currentEarliest.parsed ? current : currentEarliest,
  );

  const parsedEnds = projects
    .map((project) => {
      if (project.endedAt?.trim()) {
        const parsed = parseProjectDateValue(project.endedAt, "end");
        return parsed
          ? { value: project.endedAt.trim(), parsed, isPresent: false }
          : undefined;
      }

      if (project.status === "active" || project.status === "concept") {
        return { value: "Present", parsed: getPresentDate(), isPresent: true };
      }

      return undefined;
    })
    .filter(
      (entry): entry is { value: string; parsed: Date; isPresent: boolean } =>
        Boolean(entry),
    );

  if (parsedEnds.length === 0) {
    return undefined;
  }

  const latestEnd = parsedEnds.reduce((currentLatest, current) =>
    current.parsed > currentLatest.parsed ? current : currentLatest,
  );

  return {
    start: earliestStart.parsed,
    end: latestEnd.parsed,
    startLabel: earliestStart.value,
    endLabel: latestEnd.value,
    label: `${earliestStart.value} - ${latestEnd.value}`,
  };
}

function getCompanyDateRange(organization: string): DateRange | undefined {
  const profile = currentCompanyProfiles[organization] as
    | {
        tenureStart?: string;
        tenureEnd?: string;
      }
    | undefined;
  const tenureStart = profile?.tenureStart?.trim();
  if (!tenureStart) {
    return undefined;
  }

  const tenureEnd = profile?.tenureEnd?.trim() || "Present";
  const parsedStart = parseProjectDateValue(tenureStart, "start");
  const parsedEnd =
    tenureEnd === "Present"
      ? getPresentDate()
      : parseProjectDateValue(tenureEnd, "end");

  if (!parsedStart || !parsedEnd) {
    return undefined;
  }

  return {
    start: parsedStart,
    end: parsedEnd,
    startLabel: tenureStart,
    endLabel: tenureEnd,
    label: `${tenureStart} - ${tenureEnd}`,
  };
}

function getDateRangeFromSegments(
  segments: ParsedTimelineSegment[],
): DateRange | undefined {
  if (segments.length === 0) {
    return undefined;
  }

  const earliest = segments.reduce((currentEarliest, current) =>
    current.start < currentEarliest.start ? current : currentEarliest,
  );
  const latest = segments.reduce((currentLatest, current) =>
    current.end > currentLatest.end ? current : currentLatest,
  );

  return {
    start: earliest.start,
    end: latest.end,
    startLabel: earliest.startLabel,
    endLabel: latest.endLabel,
    label: `${earliest.startLabel} - ${latest.endLabel}`,
  };
}

export function mergeTimelineRanges(
  ranges: Array<DateRange | undefined>,
): DateRange | undefined {
  const validRanges = ranges.filter((range): range is DateRange =>
    Boolean(range),
  );

  if (validRanges.length === 0) {
    return undefined;
  }

  const earliest = validRanges.reduce((currentEarliest, current) =>
    current.start < currentEarliest.start ? current : currentEarliest,
  );
  const latest = validRanges.reduce((currentLatest, current) =>
    current.end > currentLatest.end ? current : currentLatest,
  );

  return {
    start: earliest.start,
    end: latest.end,
    startLabel: earliest.startLabel,
    endLabel: latest.endLabel,
    label: `${earliest.startLabel} - ${latest.endLabel}`,
  };
}

export function getProjectTimelineSegment(
  project: Project,
): ParsedTimelineSegment | undefined {
  const startLabel = project.startedAt?.trim();
  if (!startLabel) {
    return undefined;
  }

  const start = parseProjectDateValue(startLabel, "start");
  if (!start) {
    return undefined;
  }

  const endLabel =
    project.endedAt?.trim() ||
    (project.status === "active" || project.status === "concept"
      ? "Present"
      : undefined);
  if (!endLabel) {
    return undefined;
  }

  const end =
    endLabel === "Present"
      ? getPresentDate()
      : parseProjectDateValue(endLabel, "end");
  if (!end) {
    return undefined;
  }

  return {
    label: project.title,
    start,
    end,
    startLabel,
    endLabel,
    kind: "project",
    status: project.status,
    slug: project.slug,
  };
}

export function getRoleSegmentsFromProfile(
  organization: string,
): ParsedTimelineSegment[] {
  const profile = currentCompanyProfiles[organization] as
    | {
        timelineRoles?: Array<{ label: string; start: string; end?: string }>;
        tenureEnd?: string;
      }
    | undefined;
  if (!profile?.timelineRoles?.length) {
    return [];
  }

  return profile.timelineRoles
    .map((role): ParsedTimelineSegment | undefined => {
      const startLabel = role.start.trim();
      const endLabel =
        role.end?.trim() || profile.tenureEnd?.trim() || "Present";
      const start = parseProjectDateValue(startLabel, "start");
      const end =
        endLabel === "Present"
          ? getPresentDate()
          : parseProjectDateValue(endLabel, "end");

      if (!start || !end) {
        return undefined;
      }

      return {
        label: role.label,
        start,
        end,
        startLabel,
        endLabel,
        kind: "role" as const,
      };
    })
    .filter(
      (segment): segment is ParsedTimelineSegment => segment !== undefined,
    )
    .sort((a, b) => {
      const endDifference = (b?.end?.getTime() ?? 0) - (a?.end?.getTime() ?? 0);
      if (endDifference !== 0) {
        return endDifference;
      }

      return (b?.start?.getTime() ?? 0) - (a?.start?.getTime() ?? 0);
    });
}

export function inferRoleSegmentsFromProjects(
  projects: Project[],
): ParsedTimelineSegment[] {
  const groupedRoles = new Map<string, ParsedTimelineSegment[]>();

  for (const project of projects) {
    const segment = getProjectTimelineSegment(project);
    if (!segment) {
      continue;
    }

    const roleLabel = project.roleTitle?.trim() || "Project Contributor";

    if (!groupedRoles.has(roleLabel)) {
      groupedRoles.set(roleLabel, []);
    }

    groupedRoles.get(roleLabel)?.push(segment);
  }

  return [...groupedRoles.entries()]
    .map(([label, segments]) => {
      const earliest = segments.reduce((currentEarliest, current) =>
        current.start < currentEarliest.start ? current : currentEarliest,
      );
      const latest = segments.reduce((currentLatest, current) =>
        current.end > currentLatest.end ? current : currentLatest,
      );

      return {
        label,
        start: earliest.start,
        end: latest.end,
        startLabel: earliest.startLabel,
        endLabel: latest.endLabel,
        kind: "role" as const,
      };
    })
    .sort((a, b) => {
      const endDifference = b.end.getTime() - a.end.getTime();
      if (endDifference !== 0) {
        return endDifference;
      }

      return b.start.getTime() - a.start.getTime();
    });
}

export function buildAxisYears(range: DateRange): number[] {
  const startYear = range.start.getFullYear();
  const endYear = range.end.getFullYear();

  const years: number[] = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(year);
  }

  return years;
}

function toRenderSegment(
  segment: ParsedTimelineSegment,
  range: DateRange,
): TimelineSegment {
  const totalDurationMs = Math.max(
    range.end.getTime() - range.start.getTime(),
    1,
  );
  const rawOffset =
    ((range.end.getTime() - segment.end.getTime()) / totalDurationMs) * 100;
  const rawWidth =
    ((segment.end.getTime() - segment.start.getTime()) / totalDurationMs) * 100;
  const offsetPct = Math.min(Math.max(rawOffset, 0), 100);
  const widthPct = Math.min(Math.max(rawWidth, 1.5), 100 - offsetPct);

  return {
    label: segment.label,
    startLabel: segment.startLabel,
    endLabel: segment.endLabel,
    offsetPct,
    widthPct,
    kind: segment.kind,
    status: segment.status,
    slug: segment.slug,
  };
}

function buildCompanyTimeline(
  organization: string,
  groupedProjects: Project[],
): CompanyTimeline | undefined {
  const projectSegments = groupedProjects
    .map((project) => getProjectTimelineSegment(project))
    .filter((segment): segment is ParsedTimelineSegment => Boolean(segment))
    .sort((a, b) => {
      const endDifference = b.end.getTime() - a.end.getTime();
      if (endDifference !== 0) {
        return endDifference;
      }

      return b.start.getTime() - a.start.getTime();
    });

  const roleSegments = getRoleSegmentsFromProfile(organization);
  const resolvedRoleSegments =
    roleSegments.length > 0
      ? roleSegments
      : inferRoleSegmentsFromProjects(groupedProjects);
  const sortedRoleSegments = [...resolvedRoleSegments].sort((a, b) => {
    const endDifference = b.end.getTime() - a.end.getTime();
    if (endDifference !== 0) {
      return endDifference;
    }

    return b.start.getTime() - a.start.getTime();
  });

  const mergedRange = mergeTimelineRanges([
    getCompanyDateRange(organization),
    getDateRangeFromSegments(sortedRoleSegments),
    getDateRangeFromSegments(projectSegments),
  ]);

  if (!mergedRange) {
    return undefined;
  }

  return {
    organization,
    rangeStart: mergedRange.start,
    rangeEnd: mergedRange.end,
    rangeStartLabel: mergedRange.startLabel,
    rangeEndLabel: mergedRange.endLabel,
    rangeLabel: mergedRange.label,
    axisYears: buildAxisYears(mergedRange),
    roleSegments: sortedRoleSegments.map((segment) =>
      toRenderSegment(segment, mergedRange),
    ),
    projectSegments: projectSegments.map((segment) =>
      toRenderSegment(segment, mergedRange),
    ),
  };
}

function selectLongerRange(
  primaryRange: DateRange | undefined,
  secondaryRange: DateRange | undefined,
): DateRange | undefined {
  if (!primaryRange) {
    return secondaryRange;
  }
  if (!secondaryRange) {
    return primaryRange;
  }

  return rangeLengthInMonths(primaryRange) >=
    rangeLengthInMonths(secondaryRange)
    ? primaryRange
    : secondaryRange;
}

// Helper: get grouped projects by organization
export async function getProjectOrganizationGroups(): Promise<
  ProjectOrganizationGroup[]
> {
  const companyProfiles = await getCompanyProfiles();
  setCurrentCompanyProfiles(companyProfiles);

  const projects = await getProjects();
  const referenceNow = new Date();
  const grouped = new Map<string, Project[]>();

  for (const project of projects) {
    const organization =
      project.organization?.trim() || "Unspecified Organization";

    if (!grouped.has(organization)) {
      grouped.set(organization, []);
    }

    grouped.get(organization)?.push(project);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([organization, groupedProjects]) => {
      const orderedProjects = [...groupedProjects].sort((a, b) =>
        sortProjectsByOrderThenRecency(a, b, referenceNow),
      );
      const profile = currentCompanyProfiles[organization] as
        | {
            summary?: string;
            companyInfo?: string;
            myTimeInfo?: string;
          }
        | undefined;
      const timeline = buildCompanyTimeline(organization, orderedProjects);
      const companyRange = getCompanyDateRange(organization);
      const projectRange = getProjectDateRange(orderedProjects);
      const selectedRange = timeline
        ? { label: timeline.rangeLabel }
        : selectLongerRange(companyRange, projectRange);

      return {
        organization,
        projects: orderedProjects,
        companySummary: profile?.summary,
        companyInfo: profile?.companyInfo,
        myTimeInfo: profile?.myTimeInfo,
        timeline,
        timeRangeLabel: selectedRange?.label,
      };
    });
}

export async function getLifeTimelineEntries(): Promise<LifeTimelineEntry[]> {
  const groups = await getProjectOrganizationGroups();

  return groups
    .filter(
      (
        group,
      ): group is ProjectOrganizationGroup & { timeline: CompanyTimeline } =>
        Boolean(group.timeline),
    )
    .map((group) => ({
      organization: group.organization,
      rangeStart: group.timeline.rangeStart,
      rangeEnd: group.timeline.rangeEnd,
      rangeLabel: group.timeline.rangeLabel,
      roleHighlights: group.timeline.roleSegments
        .map((segment) => segment.label)
        .slice(0, 3),
      projectCount: group.timeline.projectSegments.length,
      projectHighlights: group.projects
        .slice(0, 2)
        .map((project) => project.title),
    }))
    .sort((a, b) => {
      const endDifference = b.rangeEnd.getTime() - a.rangeEnd.getTime();
      if (endDifference !== 0) {
        return endDifference;
      }

      return b.rangeStart.getTime() - a.rangeStart.getTime();
    });
}
