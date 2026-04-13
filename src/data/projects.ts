import { getCollection, type CollectionEntry } from "astro:content";
import { companyProfiles } from "./companyProfiles";
import { careerAtlasEras } from "./careerAtlas";

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
  timeline?: CompanyTimeline;
}

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

const atlasFallbackColors = [
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

function toSlugId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFallbackColor(label: string): string {
  let hash = 0;

  for (let index = 0; index < label.length; index++) {
    hash = (hash * 31 + label.charCodeAt(index)) >>> 0;
  }

  return atlasFallbackColors[hash % atlasFallbackColors.length];
}

function toPositioning(start: Date, end: Date, range: DateRange): { offsetPct: number; widthPct: number } {
  const totalDurationMs = Math.max(range.end.getTime() - range.start.getTime(), 1);
  const rawOffset = ((start.getTime() - range.start.getTime()) / totalDurationMs) * 100;
  const rawWidth = ((end.getTime() - start.getTime()) / totalDurationMs) * 100;
  const offsetPct = Math.min(Math.max(rawOffset, 0), 100);
  const widthPct = Math.min(Math.max(rawWidth, 1.5), 100 - offsetPct);

  return { offsetPct, widthPct };
}

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
    startLabel: earliestStart.value,
    endLabel: latestEnd.value,
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
    startLabel: tenureStart,
    endLabel: tenureEnd,
    label: `${tenureStart} - ${tenureEnd}`,
  };
}

function getDateRangeFromSegments(segments: ParsedTimelineSegment[]): DateRange | undefined {
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

function mergeTimelineRanges(ranges: Array<DateRange | undefined>): DateRange | undefined {
  const validRanges = ranges.filter((range): range is DateRange => Boolean(range));

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

function getProjectTimelineSegment(project: Project): ParsedTimelineSegment | undefined {
  const startLabel = project.startedAt?.trim();
  if (!startLabel) {
    return undefined;
  }

  const start = parseDateValue(startLabel, "start");
  if (!start) {
    return undefined;
  }

  const endLabel = project.endedAt?.trim()
    || (project.status === "active" || project.status === "concept" ? "Present" : undefined);
  if (!endLabel) {
    return undefined;
  }

  const end = endLabel === "Present" ? new Date() : parseDateValue(endLabel, "end");
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

function getRoleSegmentsFromProfile(organization: string): ParsedTimelineSegment[] {
  const profile = companyProfiles[organization];
  if (!profile?.timelineRoles?.length) {
    return [];
  }

  return profile.timelineRoles
    .map((role) => {
      const startLabel = role.start.trim();
      const endLabel = role.end?.trim() || profile.tenureEnd?.trim() || "Present";
      const start = parseDateValue(startLabel, "start");
      const end = endLabel === "Present" ? new Date() : parseDateValue(endLabel, "end");

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
    .filter((segment): segment is ParsedTimelineSegment => Boolean(segment))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

function inferRoleSegmentsFromProjects(projects: Project[]): ParsedTimelineSegment[] {
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
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

function buildAxisYears(range: DateRange): number[] {
  const startYear = range.start.getFullYear();
  const endYear = range.end.getFullYear();

  const years: number[] = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }

  return years;
}

function toRenderSegment(segment: ParsedTimelineSegment, range: DateRange): TimelineSegment {
  const totalDurationMs = Math.max(range.end.getTime() - range.start.getTime(), 1);
  const rawOffset = ((segment.start.getTime() - range.start.getTime()) / totalDurationMs) * 100;
  const rawWidth = ((segment.end.getTime() - segment.start.getTime()) / totalDurationMs) * 100;
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
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const roleSegments = getRoleSegmentsFromProfile(organization);
  const resolvedRoleSegments = roleSegments.length > 0
    ? roleSegments
    : inferRoleSegmentsFromProjects(groupedProjects);

  const mergedRange = mergeTimelineRanges([
    getCompanyDateRange(organization),
    getDateRangeFromSegments(resolvedRoleSegments),
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
    roleSegments: resolvedRoleSegments.map((segment) => toRenderSegment(segment, mergedRange)),
    projectSegments: projectSegments.map((segment) => toRenderSegment(segment, mergedRange)),
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
      const timeline = buildCompanyTimeline(organization, groupedProjects);
      const companyRange = getCompanyDateRange(organization);
      const projectRange = getProjectDateRange(groupedProjects);
      const selectedRange = timeline
        ? { label: timeline.rangeLabel }
        : selectLongerRange(companyRange, projectRange);

      return {
        organization,
        projects: groupedProjects,
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
    .filter((group): group is ProjectOrganizationGroup & { timeline: CompanyTimeline } =>
      Boolean(group.timeline)
    )
    .map((group) => ({
      organization: group.organization,
      rangeStart: group.timeline.rangeStart,
      rangeEnd: group.timeline.rangeEnd,
      rangeLabel: group.timeline.rangeLabel,
      roleHighlights: group.timeline.roleSegments.map((segment) => segment.label).slice(0, 3),
      projectCount: group.timeline.projectSegments.length,
      projectHighlights: group.projects.slice(0, 2).map((project) => project.title),
    }))
    .sort((a, b) => a.rangeStart.getTime() - b.rangeStart.getTime());
}

export async function getCareerAtlasData(): Promise<CareerAtlasData | undefined> {
  const groups = await getProjectOrganizationGroups();
  const timelineGroups = groups.filter(
    (group): group is ProjectOrganizationGroup & { timeline: CompanyTimeline } => Boolean(group.timeline),
  );

  if (timelineGroups.length === 0) {
    return undefined;
  }

  const atlasRange: DateRange = {
    start: timelineGroups.reduce(
      (earliest, current) => (current.timeline.rangeStart < earliest ? current.timeline.rangeStart : earliest),
      timelineGroups[0].timeline.rangeStart,
    ),
    end: timelineGroups.reduce(
      (latest, current) => (current.timeline.rangeEnd > latest ? current.timeline.rangeEnd : latest),
      timelineGroups[0].timeline.rangeEnd,
    ),
    startLabel: String(
      timelineGroups.reduce(
        (earliest, current) => (current.timeline.rangeStart < earliest ? current.timeline.rangeStart : earliest),
        timelineGroups[0].timeline.rangeStart,
      ).getFullYear(),
    ),
    endLabel: String(
      timelineGroups.reduce(
        (latest, current) => (current.timeline.rangeEnd > latest ? current.timeline.rangeEnd : latest),
        timelineGroups[0].timeline.rangeEnd,
      ).getFullYear(),
    ),
    label: "",
  };

  atlasRange.label = `${atlasRange.startLabel} - ${atlasRange.endLabel}`;

  const currentPosition = toPositioning(new Date(), new Date(), atlasRange);
  const companies = timelineGroups
    .map((group) => {
      const profile = companyProfiles[group.organization];
      const companyPosition = toPositioning(group.timeline.rangeStart, group.timeline.rangeEnd, atlasRange);
      const parsedRoles = getRoleSegmentsFromProfile(group.organization);
      const roleSegments = parsedRoles.length > 0 ? parsedRoles : inferRoleSegmentsFromProjects(group.projects);
      const roles = roleSegments.map((segment) => segment.label);
      const roleSummary = profile?.roleSummary || roles.slice(0, 2).join(" / ") || "Cross-functional contributor";
      const color = profile?.color || getFallbackColor(group.organization);

      const projects = group.projects
        .map((project) => {
          const segment = getProjectTimelineSegment(project);

          if (!segment) {
            return undefined;
          }

          const position = toPositioning(segment.start, segment.end, atlasRange);
          const tools = [...new Set([...(project.tools ?? []), ...(project.skills ?? [])])].slice(0, 6);
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
            isMajor: project.featured || project.status === "active" || (project.order ?? 99) <= 3,
            isLive: segment.endLabel === "Present",
          } as CareerAtlasProjectNode;
        })
        .filter((project): project is CareerAtlasProjectNode => Boolean(project))
        .sort((a, b) => a.offsetPct - b.offsetPct);

      const isActive = group.timeline.rangeEndLabel === "Present"
        || projects.some((project) => project.isLive || project.status === "active");

      return {
        id: `company-${toSlugId(group.organization)}`,
        organization: group.organization,
        color,
        summary: profile?.summary || group.companySummary || "",
        longSummary: profile?.longSummary || group.myTimeInfo,
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
    .sort((a, b) => a.offsetPct - b.offsetPct);

  const eras = careerAtlasEras.map((era) => {
    const eraStart = parseDateValue(era.start, "start") || atlasRange.start;
    const eraEnd = parseDateValue(era.end, "end") || atlasRange.end;
    const boundedStart = eraStart < atlasRange.start ? atlasRange.start : eraStart;
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
    axisYears: buildAxisYears(atlasRange),
    currentOffsetPct: currentPosition.offsetPct,
    eras,
    companies,
  };
}

function buildNarrativeProjectNode(project: Project, organization: string): CareerNarrativeProjectNode {
  const combinedTools = [...new Set([...(project.tools ?? []), ...(project.skills ?? [])])];
  const detailSummary = [project.problem, project.approach, project.outcome]
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
    isMajor: project.featured || project.status === "active" || (project.order ?? 99) <= 3,
    isLive: project.status === "active" || project.status === "concept",
    cover: project.cover,
  };
}

export async function getCareerNarrativeData(): Promise<CareerNarrativeData> {
  const groups = await getProjectOrganizationGroups();

  const companies = groups
    .map((group) => {
      const profile = companyProfiles[group.organization];
      const parsedRoles = getRoleSegmentsFromProfile(group.organization);
      const roleSegments = parsedRoles.length > 0 ? parsedRoles : inferRoleSegmentsFromProjects(group.projects);
      const roles = roleSegments.map((segment) => segment.label);
      const narrativeProjects = group.projects.map((project) => buildNarrativeProjectNode(project, group.organization));
      const featuredProjectCount = narrativeProjects.filter((project) => project.isFeatured).length;
      const activeProjectCount = narrativeProjects.filter((project) => project.isLive).length;
      const color = profile?.color || getFallbackColor(group.organization);

      return {
        id: `company-${toSlugId(group.organization)}`,
        organization: group.organization,
        summary: profile?.summary || group.companySummary || `${group.organization} work across operations, systems, and delivery.`,
        longSummary: profile?.longSummary,
        companyInfo: profile?.companyInfo,
        myTimeInfo: profile?.myTimeInfo,
        roleSummary: profile?.roleSummary || roles.slice(0, 2).join(" / ") || "Cross-functional systems work",
        roles,
        achievements: profile?.achievements ?? [],
        rangeLabel: group.timeline?.rangeLabel || group.timeRangeLabel || "Timeline not specified",
        color,
        isActive: group.timeline?.rangeEndLabel === "Present" || activeProjectCount > 0,
        projectCount: narrativeProjects.length,
        featuredProjectCount,
        activeProjectCount,
        timeline: group.timeline,
        logo: profile?.logo,
        projects: narrativeProjects,
      } as CareerNarrativeCompanyNode;
    })
    .sort((a, b) => {
      const aStart = a.timeline?.rangeStart.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bStart = b.timeline?.rangeStart.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aStart - bStart;
    });

  const projectCount = companies.reduce((total, company) => total + company.projectCount, 0);
  const activeCompanyCount = companies.filter((company) => company.isActive).length;
  const liveProjectCount = companies.reduce((total, company) => total + company.activeProjectCount, 0);

  const narrativeRange = companies.reduce<DateRange | undefined>((currentRange, company) => {
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
  }, undefined);

  return {
    rangeLabel: narrativeRange?.label || "Career timeline in progress",
    companies,
    companyCount: companies.length,
    projectCount,
    activeCompanyCount,
    liveProjectCount,
  };
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
