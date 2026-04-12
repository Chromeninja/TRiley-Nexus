export interface ExplorationItem {
  icon: string;
  title: string;
  body: string;
}

export interface PriorityItem {
  label: string;
  text: string;
  color: string;
}

export const nowLastUpdated = "April 2025";

export const explorationItems: ExplorationItem[] = [
  {
    icon: "◈",
    title: "AI-Assisted Operations",
    body: "How agentic AI tools can reduce friction in program management, status reporting, and knowledge retrieval - without adding complexity.",
  },
  {
    icon: "⬡",
    title: "Technical Program Management at Scale",
    body: "Studying how TPM functions in large-scale engineering orgs - tooling, frameworks, and how the best TPMs create leverage for their teams.",
  },
  {
    icon: "◉",
    title: "Community Infrastructure Patterns",
    body: "Documenting patterns from large gaming community operations that apply broadly to online community design and management.",
  },
  {
    icon: "▣",
    title: "Static Site Architecture",
    body: "Exploring Astro, edge deployment, and content-first site architectures for fast, maintainable web properties.",
  },
];

export const priorityItems: PriorityItem[] = [
  {
    label: "HIGH",
    text: "Complete this portfolio site and deploy to GitHub Pages",
    color: "badge-green",
  },
  {
    label: "HIGH",
    text: "Ship V1 of the AI workflow assistant",
    color: "badge-green",
  },
  {
    label: "MED",
    text: "Document community operations patterns for public sharing",
    color: "badge-yellow",
  },
  {
    label: "MED",
    text: "Deepen TypeScript and Astro proficiency through production use",
    color: "badge-yellow",
  },
  {
    label: "LOW",
    text: "Begin formal TPM certification study track",
    color: "badge-gray",
  },
];

export const openToItems = {
  yes: [
    "Technical Program Manager roles",
    "Operations lead / director roles",
    "Community platform or infrastructure roles",
    "Building 0-to-1 operational systems",
    "Organizations that value written communication and async work",
  ],
  no: [
    "Pure IC development roles without operational scope",
    "Organizations without strong writing culture",
    "Roles that are primarily status-reporting with no ownership",
    "Environments that treat busyness as productivity",
  ],
};
