/**
 * timelineSegments.ts
 * Timeline segment parsing: project spans, role segments, and axis years.
 */

import { parseProjectDateValue } from "./projectHelpers";
import { currentCompanyProfiles, getPresentDate } from "./careerShared";
import type { Project } from "./projectsCore";
import type { DateRange, ParsedTimelineSegment } from "./timelineRanges";

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
