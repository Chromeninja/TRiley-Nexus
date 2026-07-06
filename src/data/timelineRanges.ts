/**
 * timelineRanges.ts
 * Shared date-range types and range derivation helpers for career timelines.
 */

import { parseProjectDateValue } from "./projectHelpers";
import { currentCompanyProfiles, getPresentDate } from "./careerShared";
import type { Project } from "./projectsCore";

export interface DateRange {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  label: string;
}

export interface ParsedTimelineSegment {
  label: string;
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  kind: "role" | "project";
  status?: Project["status"];
  slug?: string;
}

export function getProjectDateRange(projects: Project[]): DateRange | undefined {
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

export function getCompanyDateRange(organization: string): DateRange | undefined {
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

export function getDateRangeFromSegments(
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
