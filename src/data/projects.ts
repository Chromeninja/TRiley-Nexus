// ============================================================
// PROJECT DATA
// TRiley Nexus — Content Model
// To add a project: copy one entry and update the fields.
// ============================================================

export interface Project {
  slug: string;
  title: string;
  status: "active" | "completed" | "archived" | "concept";
  category: string;
  tags: string[];
  organization?: string;
  timeframe?: string;
  summary: string;
  problem?: string;
  approach?: string;
  outcome?: string;
  skills?: string[];
  tools?: string[];
  links?: { label: string; url: string }[];
  featured: boolean;
  order?: number;
}

export const projects: Project[] = [
  {
    slug: "community-ops-platform",
    title: "Community Operations Platform",
    status: "active",
    category: "Community Systems",
    tags: ["Community", "Automation", "Discord", "Operations"],
    organization: "Independent",
    timeframe: "2023 – Present",
    summary:
      "Designed and built a modular operations platform for large online gaming communities, combining automated moderation, event scheduling, role management, and member onboarding into a unified system.",
    problem:
      "Managing a community of 5,000+ members across Discord and multiple game titles required juggling fragmented tools, manual processes, and inconsistent moderation. Staff burnout and member churn were rising.",
    approach:
      "Mapped all community touchpoints, identified manual bottlenecks, and designed an integrated system using Discord bots, webhooks, and structured data. Built modular automation workflows for moderation, events, and onboarding that staff could configure without coding.",
    outcome:
      "Reduced staff coordination overhead by ~60%, cut new member onboarding time from 10 minutes to under 90 seconds, and improved event turnout rates through automated reminders and scheduling integration.",
    skills: ["Systems Design", "Community Management", "Process Automation", "Technical Leadership"],
    tools: ["Discord.js", "Node.js", "Google Sheets API", "Zapier", "Notion"],
    featured: true,
    order: 1,
  },
  {
    slug: "live-event-ops-framework",
    title: "Live Event Operations Framework",
    status: "completed",
    category: "Event Operations",
    tags: ["Events", "Operations", "Logistics", "Program Management"],
    organization: "Community Events Division",
    timeframe: "2022 – 2023",
    summary:
      "Created a repeatable end-to-end framework for managing large-scale live gaming events, from concept to execution to post-event retrospective, serving events with 200–800 concurrent participants.",
    problem:
      "Each event was rebuilt from scratch, leading to inconsistent quality, missed details, and exhausted coordinators. There was no institutional knowledge capture or standardized playbook.",
    approach:
      "Conducted retrospectives across 12 past events, identified failure modes, and built a tiered event playbook system covering pre-event planning, live operations, contingency handling, and post-event analysis.",
    outcome:
      "Events using the framework had measurably fewer critical incidents, faster issue resolution, and consistent post-event satisfaction scores above 90%. The playbook was adopted by three additional event teams.",
    skills: ["Event Management", "Technical Program Management", "Documentation", "Process Design"],
    tools: ["Notion", "Google Workspace", "Discord", "OBS", "Twitch"],
    featured: true,
    order: 2,
  },
  {
    slug: "infrastructure-modernization",
    title: "Server Infrastructure Modernization",
    status: "completed",
    category: "Infrastructure",
    tags: ["Infrastructure", "Automation", "DevOps", "Migration"],
    organization: "Gaming Community Network",
    timeframe: "2021 – 2022",
    summary:
      "Led the migration of a community's aging server infrastructure to a modern containerized architecture, improving reliability, reducing costs, and enabling faster deployment of new services.",
    problem:
      "Legacy VMs were difficult to manage, prone to configuration drift, and required manual intervention for deployments. Downtime events were frequent and time-consuming to diagnose.",
    approach:
      "Assessed current state, identified high-impact migration targets, and built a phased migration plan. Containerized key services using Docker, implemented monitoring with Grafana, and created runbooks for common operational scenarios.",
    outcome:
      "Reduced deployment time from days to under an hour, eliminated configuration drift issues, and improved service uptime from 97.2% to 99.6% over six months post-migration.",
    skills: ["Infrastructure", "DevOps", "Technical Planning", "Change Management"],
    tools: ["Docker", "Linux", "Grafana", "Nginx", "Ansible"],
    featured: true,
    order: 3,
  },
  {
    slug: "ai-workflow-assistant",
    title: "AI-Powered Workflow Assistant",
    status: "active",
    category: "AI / Workflow Tools",
    tags: ["AI", "Automation", "Productivity", "LLM"],
    organization: "Personal Project",
    timeframe: "2024 – Present",
    summary:
      "Building a personal AI workflow assistant that integrates with my existing tools to reduce context-switching, surface relevant information proactively, and automate routine decision-making.",
    problem:
      "Fragmented tooling and constant context-switching was degrading deep work time. I needed a system that understood my work context and could handle routine tasks without interrupting focus.",
    approach:
      "Designed a lightweight assistant architecture using local LLM models with a retrieval layer over my notes and project data. Building integrations with key tools via APIs and exploring agentic workflows for common task patterns.",
    outcome:
      "In active development. Early results show meaningful reduction in time spent on routine information retrieval and status reporting.",
    skills: ["AI/ML", "Systems Design", "API Integration", "Workflow Automation"],
    tools: ["Python", "Ollama", "LangChain", "Obsidian", "REST APIs"],
    featured: true,
    order: 4,
  },
  {
    slug: "military-operations-planning",
    title: "Military Operations Planning System",
    status: "completed",
    category: "Military Operations",
    tags: ["Military", "Planning", "Leadership", "Operations"],
    organization: "U.S. Military",
    timeframe: "2010 – 2018",
    summary:
      "Developed and executed operational planning frameworks for complex, time-sensitive military operations, coordinating cross-functional teams and managing mission-critical communication systems.",
    problem:
      "Large-scale operations require precise coordination across multiple units, time zones, and communication networks. Information flow failures in high-stakes environments have serious consequences.",
    approach:
      "Applied structured military planning methodologies (MDMP) adapted for real-world operational constraints. Built communication plans, coordinated logistics, managed operational security, and led teams through execution.",
    outcome:
      "Successfully planned and executed 40+ operations with zero critical communication failures. Developed training materials used by subsequent teams and received commendation for operational excellence.",
    skills: ["Military Leadership", "Operations Planning", "Risk Management", "Team Leadership"],
    tools: ["MDMP", "Communications Systems", "Tactical Operations Centers"],
    featured: false,
    order: 5,
  },
  {
    slug: "community-governance-system",
    title: "Community Governance & Policy System",
    status: "completed",
    category: "Community Systems",
    tags: ["Community", "Policy", "Governance", "Documentation"],
    organization: "Gaming Community",
    timeframe: "2020 – 2021",
    summary:
      "Designed a transparent, scalable governance system for a large gaming community, including policy documentation, appeals processes, moderation standards, and community feedback mechanisms.",
    problem:
      "As the community grew beyond 3,000 members, inconsistent enforcement and opaque decision-making were eroding trust. Members didn't know the rules or how decisions were made.",
    approach:
      "Researched governance models from open-source projects and established communities. Drafted tiered policy documentation, built an appeals workflow, created public-facing decision logs, and trained a moderation team of 12.",
    outcome:
      "Community trust scores (measured via regular surveys) increased by 34% over 18 months. Appeal rate dropped by 45% as consistent enforcement reduced ambiguity. Moderation team turnover fell significantly.",
    skills: ["Policy Design", "Documentation", "Community Management", "Training"],
    tools: ["Notion", "Discord", "Google Forms", "Typeform"],
    featured: false,
    order: 6,
  },
  {
    slug: "program-management-tooling",
    title: "TPM Tooling & Dashboard Suite",
    status: "active",
    category: "Program Management",
    tags: ["TPM", "Dashboards", "Automation", "Reporting"],
    organization: "Personal Project",
    timeframe: "2024 – Present",
    summary:
      "Building a personal suite of program management tools including automated status reporting, dependency tracking, and risk visualization dashboards tailored for complex multi-workstream programs.",
    problem:
      "Standard PM tooling doesn't surface the right signals for complex programs. Status reports are time-consuming to produce and often don't reflect actual program health.",
    approach:
      "Designing data-first dashboards that aggregate signals from multiple sources, apply custom health scoring, and auto-generate concise executive summaries. Building on top of existing tools rather than replacing them.",
    outcome: "In development. Initial prototypes validated with real program data.",
    skills: ["Program Management", "Data Visualization", "Automation", "Systems Thinking"],
    tools: ["Python", "Notion API", "Google Sheets API", "Charts.js"],
    featured: false,
    order: 7,
  },
];

// Helper: get featured projects
export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

// Helper: get projects by category
export function getProjectsByCategory(category: string): Project[] {
  return projects.filter((p) => p.category === category);
}

// Helper: get all unique categories
export function getCategories(): string[] {
  return [...new Set(projects.map((p) => p.category))];
}

// Helper: get project by slug
export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

// Helper: get active projects
export function getActiveProjects(): Project[] {
  return projects.filter((p) => p.status === "active").sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}
