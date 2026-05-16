// Project formatting and date parsing helpers
import { monthLookup, monthAbbreviations } from "./projectThemes";
import type { Project } from "./projects";

/**
 * Format a date range for a project
 * Returns formatted string like "Jan 2023 - May 2024"
 * Falls back to timeframe field if exact dates unavailable
 */
export function formatProjectDateRange(
  project: Pick<Project, "startedAt" | "endedAt" | "timeframe">,
): string | undefined {
  const startedAt = project.startedAt?.trim();
  const endedAt = project.endedAt?.trim();

  if (startedAt && endedAt) {
    return `${formatMonthYear(startedAt)} - ${formatMonthYear(endedAt)}`;
  }

  if (startedAt) {
    return `${formatMonthYear(startedAt)} - Present`;
  }

  return project.timeframe?.trim();
}

/**
 * Parse project date value to Date object
 * Supports formats: "Month Year" (e.g., "Jan 2023") or "Year" (e.g., "2023")
 * @param boundary - "start" for first day of month/year, "end" for last day
 */
export function parseProjectDateValue(
  value: string,
  boundary: "start" | "end" = "start",
): Date | undefined {
  const trimmed = value.trim();

  // Try "Month Year" format (e.g., "Jan 2023")
  const monthYearMatch = /^(\w+)\s+(\d{4})$/i.exec(trimmed);
  if (monthYearMatch) {
    const monthValue = monthLookup[monthYearMatch[1].slice(0, 3).toLowerCase()];
    if (monthValue === undefined) {
      return undefined;
    }

    const yearValue = Number.parseInt(monthYearMatch[2], 10);
    const dayValue =
      boundary === "start"
        ? 1
        : new Date(yearValue, monthValue + 1, 0).getDate();
    return new Date(yearValue, monthValue, dayValue);
  }

  // Try "Year" only format (e.g., "2023")
  const yearOnlyMatch = /^(\d{4})$/.exec(trimmed);
  if (yearOnlyMatch) {
    const yearValue = Number.parseInt(yearOnlyMatch[1], 10);
    if (boundary === "start") {
      return new Date(yearValue, 0, 1);
    }
    return new Date(yearValue, 11, 31);
  }

  return undefined;
}

/**
 * Format a month-year date string
 * Converts "2023-01" or "Jan 2023" format to "Jan 2023"
 * @internal
 */
export function formatMonthYear(dateString: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(dateString.trim());
  if (match) {
    const year = match[1];
    const monthNum = Number.parseInt(match[2], 10) - 1;
    if (monthNum >= 0 && monthNum <= 11) {
      return `${monthAbbreviations[monthNum]} ${year}`;
    }
  }
  return dateString;
}

/**
 * Hash a string to get deterministic color index
 * Used for selecting fallback colors for timeline visualization
 * @internal
 */
export function hashStringToIndex(value: string, arrayLength: number): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % arrayLength;
}

/**
 * Convert a string to URL-safe slug format
 * Used for generating unique IDs in timeline visualization
 * @internal
 */
export function toSlugId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Calculate range length in months
 * Used for comparing date ranges in timeline logic
 * @internal
 */
export function rangeLengthInMonths(
  range: { start: Date; end: Date },
): number {
  return (
    (range.end.getFullYear() - range.start.getFullYear()) * 12 +
    (range.end.getMonth() - range.start.getMonth())
  );
}
