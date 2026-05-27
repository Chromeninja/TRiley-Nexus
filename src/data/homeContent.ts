export interface HomePrinciple {
  num: string;
  text: string;
}

export interface HomeStat {
  value: string;
  label: string;
}

export interface HomeStrength {
  icon: string;
  title: string;
  description: string;
}

export interface HomeProjectFocusArea {
  title: string;
  text: string;
  proof: string;
  href: string;
}

import { siteConfig } from "./siteConfig";

export const homePrinciples: HomePrinciple[] = siteConfig.home.principles;

export const homeStats: HomeStat[] = siteConfig.home.stats;

const featuredStrengthTitles = new Set([
  "Systems Thinking",
  "Operational Clarity",
  "Program Execution",
  "Leadership Under Pressure",
]);

const selectedStrengths = siteConfig.skills.coreStrengths.filter((strength) =>
  featuredStrengthTitles.has(strength.title),
);

export const homeFeaturedStrengths: HomeStrength[] =
  selectedStrengths.length > 0
    ? selectedStrengths
    : siteConfig.skills.coreStrengths.slice(0, 4);

export const homeProjectFocusAreas: HomeProjectFocusArea[] = [
  {
    title: "Program systems inside large organizations",
    text: "Cross-functional delivery, customer experience operations, support automation, and decision-making cadence for teams with many dependencies.",
    proof: "Ubisoft refund automation and Senior Program Manager scope",
    href: "/projects/automated-refund-flow",
  },
  {
    title: "Community governance at real scale",
    text: "Permissions, moderation systems, Discord operations, and workflow design for communities that need structure without becoming brittle.",
    proof: "40,000-member Star Citizen community operations",
    href: "/projects/discord-governance",
  },
  {
    title: "Live event and field operations",
    text: "Event coordination, booth operations, volunteer leadership, and operating tools for moments where timing, handoffs, and human clarity matter.",
    proof: "CitizenCon, Quantum Vegas, and VR event operations",
    href: "/projects/event-operations-program",
  },
  {
    title: "Pressure-tested operational discipline",
    text: "Military air traffic control and landing zone safety experience translated into calm execution, risk visibility, and tighter operating habits.",
    proof: "15+ years of military service and ATC work",
    href: "/projects/air-traffic-control",
  },
];
