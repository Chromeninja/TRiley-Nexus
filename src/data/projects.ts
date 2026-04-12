import { getCollection, type CollectionEntry } from "astro:content";
import { companyProfiles } from "./companyProfiles";

type ProjectCollectionEntry = CollectionEntry<"projects">;

export type Project = ProjectCollectionEntry["data"] & {
  slug: string;
};

export interface ProjectOrganizationGroup {
  organization: string;
  projects: Project[];
  companySummary?: string;
  companyInfo?: string;
  myTimeInfo?: string;
  timeRangeLabel?: string;
}

interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

const monthLookup: Record<string, number> = {
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

export const projectStatusColors: Record<Project["status"], string> = {
  active: "badge-green",
  completed: "badge-cyan",
  archived: "badge-gray",
  concept: "badge-yellow",
};

export const projectStatusLabels: Record<Project["status"], string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  concept: "Concept",
};

const projectStatusSortOrder: Record<Project["status"], number> = {
  active: 0,
  concept: 1,
  completed: 2,
  archived: 3,
};

function toProject(entry: ProjectCollectionEntry): Project {
  return {
    ...entry.data,
    slug: entry.id.replace(/\.md$/, ""),
  };
}

function sortByOrder(a: Project, b: Project): number {
  const statusDifference = projectStatusSortOrder[a.status] - projectStatusSortOrder[b.status];

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return (a.order ?? 99) - (b.order ?? 99);
}

export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection("projects");
  return entries.map(toProject).sort(sortByOrder);
}

export function formatProjectDateRange(
  project: Pick<Project, "startedAt" | "endedAt" | "timeframe">,
): string | undefined {
  const startedAt = project.startedAt?.trim();
  const endedAt = project.endedAt?.trim();

  if (startedAt && endedAt) {
    return `${startedAt} - ${endedAt}`;
  }

  if (startedAt) {
    return `${startedAt} - Present`;
  }

  return project.timeframe?.trim();
}

function parseDateValue(value: string, boundary: "start" | "end"): Date | undefined {
  const trimmed = value.trim();

  const monthYearMatch = /^(\w+)\s+(\d{4})$/i.exec(trimmed);
  if (monthYearMatch) {
    const monthValue = monthLookup[monthYearMatch[1].slice(0, 3).toLowerCase()];
    if (monthValue === undefined) {
      return undefined;
    }

    const yearValue = Number.parseInt(monthYearMatch[2], 10);
    const dayValue = boundary === "start" ? 1 : new Date(yearValue, monthValue + 1, 0).getDate();
    return new Date(yearValue, monthValue, dayValue);
  }

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

function getProjectDateRange(projects: Project[]): DateRange | undefined {
  const startCandidates = projects
    .map((project) => project.startedAt?.trim())
    .filter(Boolean) as string[];
  const parsedStarts = startCandidates
    .map((value) => ({ value, parsed: parseDateValue(value, "start") }))
    .filter((entry): entry is { value: string; parsed: Date } => Boolean(entry.parsed));

  if (parsedStarts.length === 0) {
    return undefined;
  }

  const earliestStart = parsedStarts.reduce((currentEarliest, current) =>
    current.parsed < currentEarliest.parsed ? current : currentEarliest,
  );

  const parsedEnds = projects
    .map((project) => {
      if (project.endedAt?.trim()) {
        const parsed = parseDateValue(project.endedAt, "end");
        return parsed ? { value: project.endedAt.trim(), parsed, isPresent: false } : undefined;
      }

      if (project.status === "active" || project.status === "concept") {
        return { value: "Present", parsed: new Date(), isPresent: true };
      }

      return undefined;
    })
    .filter(
      (entry): entry is { value: string; parsed: Date; isPresent: boolean } => Boolean(entry),
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
    label: `${earliestStart.value} - ${latestEnd.value}`,
  };
}

function getCompanyDateRange(organization: string): DateRange | undefined {
  const profile = companyProfiles[organization];
  const tenureStart = profile?.tenureStart?.trim();
  if (!tenureStart) {
    return undefined;
  }

  const tenureEnd = profile.tenureEnd?.trim() || "Present";
  const parsedStart = parseDateValue(tenureStart, "start");
  const parsedEnd = tenureEnd === "Present" ? new Date() : parseDateValue(tenureEnd, "end");

  if (!parsedStart || !parsedEnd) {
    return undefined;
  }

  return {
    start: parsedStart,
    end: parsedEnd,
    label: `${tenureStart} - ${tenureEnd}`,
  };
}

function rangeLengthInMonths(range: DateRange): number {
  return (
    (range.end.getFullYear() - range.start.getFullYear()) * 12
    + (range.end.getMonth() - range.start.getMonth())
  );
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

  return rangeLengthInMonths(primaryRange) >= rangeLengthInMonths(secondaryRange)
    ? primaryRange
    : secondaryRange;
}

// Helper: get featured projects
export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.featured);
}

// Helper: get projects by category
export async function getProjectsByCategory(category: string): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.category === category);
}

// Helper: get all unique categories
export async function getCategories(): Promise<string[]> {
  const projects = await getProjects();
  return [...new Set(projects.map((p) => p.category))];
}

// Helper: get all unique organizations
export async function getOrganizations(): Promise<string[]> {
  const projects = await getProjects();
  return [...new Set(projects.map((p) => p.organization?.trim()).filter(Boolean) as string[])].sort(
    (a, b) => a.localeCompare(b),
  );
}

// Helper: get projects by organization
export async function getProjectsByOrganization(organization: string): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.organization === organization);
}

// Helper: get grouped projects by organization
export async function getProjectOrganizationGroups(): Promise<ProjectOrganizationGroup[]> {
  const projects = await getProjects();
  const grouped = new Map<string, Project[]>();

  for (const project of projects) {
    const organization = project.organization?.trim() || "Independent";

    if (!grouped.has(organization)) {
      grouped.set(organization, []);
    }

    grouped.get(organization)?.push(project);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([organization, groupedProjects]) => {
      const profile = companyProfiles[organization];
      const companyRange = getCompanyDateRange(organization);
      const projectRange = getProjectDateRange(groupedProjects);
      const selectedRange = selectLongerRange(companyRange, projectRange);

      return {
        organization,
        projects: groupedProjects,
        companySummary: profile?.summary,
        companyInfo: profile?.companyInfo,
        myTimeInfo: profile?.myTimeInfo,
        timeRangeLabel: selectedRange?.label,
      };
    });
}

// Helper: get project by slug
export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug);
}

// Helper: get active projects
export async function getActiveProjects(): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.status === "active").sort(sortByOrder);
}
