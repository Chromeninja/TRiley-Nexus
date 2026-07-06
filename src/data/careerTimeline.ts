/**
 * careerTimeline.ts
 * Company timelines, life timeline entries, and grouped projects by organization.
 * Range and segment parsing helpers live in timelineRanges.ts / timelineSegments.ts.
 */

import { getCompanyProfiles } from "./companyProfiles";
import {
  currentCompanyProfiles,
  setCurrentCompanyProfiles,
} from "./careerShared";
import { rangeLengthInMonths } from "./projectHelpers";
import {
  getProjects,
  sortProjectsByOrderThenRecency,
  type Project,
} from "./projectsCore";
import {
  getProjectDateRange,
  getCompanyDateRange,
  getDateRangeFromSegments,
  type DateRange,
  type ParsedTimelineSegment,
} from "./timelineRanges";
import {
  mergeTimelineRanges,
  getProjectTimelineSegment,
  getRoleSegmentsFromProfile,
  inferRoleSegmentsFromProjects,
  buildAxisYears,
} from "./timelineSegments";

// Re-export the segment API so existing "./careerTimeline" imports keep working
export {
  mergeTimelineRanges,
  getProjectTimelineSegment,
  getRoleSegmentsFromProfile,
  inferRoleSegmentsFromProjects,
  buildAxisYears,
} from "./timelineSegments";

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
