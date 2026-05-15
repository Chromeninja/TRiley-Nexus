// Project theme constants: colors, labels, status ordering
import type { Project } from "./projects";

/**
 * Color badge classes for project status values
 * Maps status to TailwindCSS badge color class
 */
export const projectStatusColors: Record<Project["status"], string> = {
  active: "badge-green",
  completed: "badge-cyan",
  archived: "badge-gray",
  concept: "badge-yellow",
};

/**
 * Display labels for project status values
 * Used in UI to show human-readable status text
 */
export const projectStatusLabels: Record<Project["status"], string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  concept: "Concept",
};

/**
 * Sort order for project status
 * Used to rank projects in lists and timeline views
 * @internal
 */
export const projectStatusSortOrder: Record<Project["status"], number> = {
  active: 0,
  concept: 1,
  completed: 2,
  archived: 3,
};

/**
 * Month lookup map for parsing month abbreviations to numbers
 * @internal
 */
export const monthLookup: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/**
 * Month abbreviations for formatting dates
 * @internal
 */
export const monthAbbreviations = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Fallback color palette for timeline visualization
 * Used when company doesn't have explicit color defined
 * @internal
 */
export const atlasFallbackColors = [
  "#5cc8ff",
  "#8be36d",
  "#f5a65b",
  "#de87ff",
  "#5eead4",
  "#f38ba8",
  "#c4b5fd",
  "#facc15",
  "#22d3ee",
];
