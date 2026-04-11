// ============================================================
// SKILLS & CAPABILITIES DATA
// ============================================================

export interface SkillGroup {
  label: string;
  icon: string;
  skills: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    label: "Technical Program Management",
    icon: "◈",
    skills: [
      "Program Planning & Roadmapping",
      "Risk Management",
      "Cross-functional Coordination",
      "Stakeholder Communication",
      "OKR / KPI Frameworks",
      "Dependency Mapping",
    ],
  },
  {
    label: "Operations & Systems",
    icon: "⬡",
    skills: [
      "Systems Design",
      "Process Automation",
      "Infrastructure Operations",
      "Incident Management",
      "Runbook Development",
      "Change Management",
    ],
  },
  {
    label: "Community & Event Leadership",
    icon: "◉",
    skills: [
      "Community Architecture",
      "Governance Design",
      "Live Event Operations",
      "Moderation Systems",
      "Member Experience",
      "Community Analytics",
    ],
  },
  {
    label: "Technology & Tools",
    icon: "▣",
    skills: [
      "Discord Bot Development",
      "API Integration",
      "Workflow Automation",
      "AI / LLM Tools",
      "Data Visualization",
      "Static Site Development",
    ],
  },
  {
    label: "Leadership & Strategy",
    icon: "◆",
    skills: [
      "Military Leadership",
      "Team Building & Coaching",
      "Strategic Planning",
      "Mission Clarity",
      "Decision Frameworks",
      "After Action Review",
    ],
  },
];

export const coreStrengths = [
  {
    icon: "⬡",
    title: "Systems Thinking",
    description:
      "I see the whole board — how processes, people, and tools interact — and design solutions that hold up under real-world conditions.",
  },
  {
    icon: "◈",
    title: "Operational Clarity",
    description:
      "I turn messy, ambiguous problems into structured plans with clear ownership, defined outcomes, and measurable progress.",
  },
  {
    icon: "◉",
    title: "Community Architecture",
    description:
      "I build the systems that keep communities running — governance, automation, culture, and the quiet infrastructure most people never see.",
  },
  {
    icon: "▣",
    title: "Automation & Tooling",
    description:
      "If a process can be systematized, I find a way to do it — reducing manual overhead and letting humans focus on judgment work.",
  },
  {
    icon: "◆",
    title: "Program Execution",
    description:
      "From concept to delivery: I plan, coordinate, adapt, and ship — whether it's a live event, a migration, or a long-running product initiative.",
  },
  {
    icon: "⊕",
    title: "Leadership Under Pressure",
    description:
      "Military background and years of leading teams through high-stakes, time-critical environments built a foundation that holds when things get hard.",
  },
];
