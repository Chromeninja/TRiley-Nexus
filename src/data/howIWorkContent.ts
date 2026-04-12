export interface WorkPrinciple {
  num: string;
  title: string;
  body: string;
}

export interface WorkStyleGroup {
  icon: string;
  title: string;
  items: string[];
}

export interface ToolchainGroup {
  category: string;
  tools: string[];
}

export interface AARQuestion {
  q: string;
  sub: string;
}

export const coreApproachParagraphs: string[] = [
  "I'm not a specialist in one domain - I'm a generalist who builds systems. The through-line in everything I do is translating complexity into structure: taking messy, ambiguous situations and creating clarity, process, and working systems out of them.",
  "Whether I'm planning a military operation, running a large-scale community event, migrating aging infrastructure, or designing an automation workflow, the underlying methodology is the same. Understand the system. Identify the failure modes. Build something that actually holds up in production.",
];

export const workPrinciples: WorkPrinciple[] = [
  {
    num: "01",
    title: "Diagnose before designing",
    body: "The biggest failure mode in operations and engineering is solving the wrong problem well. I invest heavily in diagnosis - understanding root causes, mapping system states, and validating assumptions before proposing solutions. The stated problem is rarely the actual problem.",
  },
  {
    num: "02",
    title: "Build systems, not solutions",
    body: "A one-off fix is not a solution - it's technical debt with a short grace period. I build repeatable, maintainable systems that can be operated by others, updated without me, and scaled beyond the original scope. If it's not systemized, it's not done.",
  },
  {
    num: "03",
    title: "Align people before automating process",
    body: "Technology amplifies what's already in the organization. Automating a broken process makes broken things happen faster. I always start with the human system - the incentives, the workflows, the communication patterns - before reaching for tooling.",
  },
  {
    num: "04",
    title: "Create clarity in ambiguity",
    body: "Ambiguity is not an obstacle - it's the job. My role is to reduce uncertainty for the people around me: clear problem statements, defined ownership, explicit tradeoffs, documented decisions. Clarity is a deliverable.",
  },
  {
    num: "05",
    title: "Balance strategy and execution",
    body: "Most operational failures come from working at only one altitude - either too zoomed out to execute or too zoomed in to see the full picture. I deliberately move between both. Long-term architecture and immediate execution decisions both need attention simultaneously.",
  },
  {
    num: "06",
    title: "Design for the humans who actually exist",
    body: "Systems succeed or fail at the human interface. I build for the real operators - with their real constraints, cognitive loads, and failure modes - not the idealized ones. Good design accounts for how people actually behave under pressure.",
  },
];

export const workStyleGroups: WorkStyleGroup[] = [
  {
    icon: "◈",
    title: "How I communicate",
    items: [
      "Direct, without being blunt. I say what I mean.",
      "Written-first - I think clearly in structured writing.",
      "I document decisions and the reasoning behind them.",
      "Async by default, synchronous when it actually requires synchrony.",
      "I give candid feedback and expect it in return.",
    ],
  },
  {
    icon: "⬡",
    title: "How I plan",
    items: [
      "Start with outcomes, not activities.",
      "Work backward from the deadline with explicit milestones.",
      "Build contingency into the plan before it's needed.",
      "Track health, not just status - are we actually going to make it?",
      "Regular review cadences to catch drift early.",
    ],
  },
  {
    icon: "◉",
    title: "How I lead teams",
    items: [
      "Clear mission and commander's intent - then let people execute.",
      "Make ownership unambiguous. No unclear handoffs.",
      "Run lightweight, high-value retrospectives after every major event.",
      "Shield the team from noise; escalate blockers fast.",
      "Invest in capability building, not just task completion.",
    ],
  },
  {
    icon: "▣",
    title: "How I build",
    items: [
      "Simplest working solution first, then optimize.",
      "Document as I go - future me and future operators need this.",
      "Build for observability - you can't operate what you can't see.",
      "Automate the repeatable; keep humans in judgment roles.",
      "Nothing is done until it's documented and someone else can run it.",
    ],
  },
];

export const toolchainGroups: ToolchainGroup[] = [
  {
    category: "Planning & Documentation",
    tools: ["Notion", "Obsidian", "Google Workspace", "Markdown"],
  },
  {
    category: "Community & Comms",
    tools: ["Discord", "Discord.js", "Webhooks", "Slack"],
  },
  {
    category: "Automation & Integration",
    tools: ["Zapier", "n8n", "Python", "REST APIs", "Node.js"],
  },
  {
    category: "AI & Workflow",
    tools: ["Ollama", "LangChain", "GPT-4", "Claude", "Prompt Engineering"],
  },
  {
    category: "Infrastructure",
    tools: ["Docker", "Linux", "Nginx", "Grafana", "Ansible"],
  },
  {
    category: "Development",
    tools: ["VS Code", "Git", "Astro", "TypeScript", "Python"],
  },
];

export const aarIntro =
  "The After Action Review (AAR) is one of the most valuable practices I took from military service. After every significant operation, event, or project, I ask:";

export const aarQuestions: AARQuestion[] = [
  {
    q: "What was supposed to happen?",
    sub: "The plan, the intent, the expected outcome.",
  },
  {
    q: "What actually happened?",
    sub: "Honest, factual account - no spin, no blame.",
  },
  {
    q: "Why was there a difference?",
    sub: "Root causes, not symptoms. Contributing factors.",
  },
  {
    q: "What do we sustain?",
    sub: "What worked? What should become standard practice?",
  },
  {
    q: "What do we improve?",
    sub: "Specific, actionable changes to make the next one better.",
  },
];
