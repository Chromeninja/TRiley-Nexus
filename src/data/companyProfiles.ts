export interface CompanyTimelineRoleEntry {
  label: string;
  start: string;
  end?: string;
}

export interface CompanyProfile {
  summary: string;
  companyInfo: string;
  myTimeInfo: string;
  longSummary?: string;
  roleSummary?: string;
  achievements?: string[];
  color?: string;
  tenureStart?: string;
  tenureEnd?: string;
  timelineRoles?: CompanyTimelineRoleEntry[];
}

export const companyProfiles: Record<string, CompanyProfile> = {
  Ubisoft: {
    summary:
      "Player-support, platform, and live-service program work across multiple Ubisoft surfaces and launches.",
    companyInfo:
      "Ubisoft is a global game publisher and live-service operator supporting large player communities across multiple titles, subscription products, and support platforms.",
    myTimeInfo:
      "From 2013 to 2024, I worked across Ubisoft support and platform operations, including Ubisoft Help improvements, R6Fix quality reporting, For Honor bug reporting workflows, Ubisoft+ launch support, GamePlan integration, Gear Store launch readiness, and automated refund flow operations.",
    longSummary:
      "Long-horizon work across player support and live platform operations, scaling issue quality, automation pathways, launch readiness, and cross-functional coordination with support, product, and development teams.",
    roleSummary: "Support operations to senior program leadership",
    achievements: [
      "Scaled reporting quality loops for live-service teams.",
      "Improved release readiness for support-facing platform launches.",
      "Aligned operations, support, and product stakeholders across multiple surfaces.",
    ],
    color: "#5cc8ff",
    tenureStart: "2013",
    tenureEnd: "2024",
    timelineRoles: [
      {
        label: "Support Operations Specialist",
        start: "2013",
        end: "2016",
      },
      {
        label: "Program Manager",
        start: "2017",
        end: "2020",
      },
      {
        label: "Senior Program Manager",
        start: "2021",
        end: "2024",
      },
    ],
  },
  "Happy Manic": {
    summary: "Production pipeline and community testing program work for game and XR initiatives.",
    companyInfo:
      "Happy Manic is a creative production environment focused on experimentation, rapid iteration, and community-facing game experiences.",
    myTimeInfo:
      "Contributed to production pipeline management, Perforce migration, and structured community testing workflows.",
    longSummary:
      "Hands-on operational leadership across process reliability and content delivery flow, balancing speed with quality.",
    roleSummary: "Pipeline operations and community program systems",
    achievements: [
      "Modernized production handoff practices.",
      "Improved testing signal quality through community program structure.",
    ],
    color: "#8be36d",
    tenureStart: "2021",
    tenureEnd: "Present",
    timelineRoles: [
      {
        label: "Technical Producer",
        start: "2021",
        end: "Present",
      },
    ],
  },
  "TEST Squadron": {
    summary: "Community tooling and internal systems spanning dashboards, API services, and bot automation.",
    companyInfo:
      "TEST Squadron represents a community-focused operating model with lightweight product development and platform tooling.",
    myTimeInfo:
      "Built and coordinated internal admin systems, Discord automation, and API service layers for operations.",
    roleSummary: "Systems builder for community operations",
    achievements: [
      "Connected moderation workflows with actionable system tooling.",
      "Reduced manual effort through service-layer and bot automation.",
    ],
    color: "#de87ff",
    tenureStart: "2020",
    tenureEnd: "Present",
    timelineRoles: [
      {
        label: "Platform Engineer",
        start: "2020",
        end: "Present",
      },
    ],
  },
  Independent: {
    summary: "Independent products and experiments across software, XR, and operational tooling.",
    companyInfo: "Self-directed R&D and product exploration.",
    myTimeInfo:
      "Focused on prototyping new experiences, validating ideas quickly, and shipping iterative builds.",
    roleSummary: "Independent builder and systems designer",
    color: "#facc15",
    tenureStart: "2021",
    tenureEnd: "Present",
    timelineRoles: [
      {
        label: "XR Developer",
        start: "2021",
        end: "2022",
      },
      {
        label: "Independent Builder",
        start: "2022",
        end: "Present",
      },
    ],
  },
  "Bar Citizen": {
    summary: "Community event and operations support initiatives.",
    companyInfo: "Community-led operations and collaboration across event contexts.",
    myTimeInfo: "Supported operations and program execution in community-facing settings.",
    roleSummary: "Community operations contributor",
    color: "#5eead4",
    tenureStart: "2019",
    tenureEnd: "2022",
    timelineRoles: [
      {
        label: "Community Operations Lead",
        start: "2019",
        end: "2022",
      },
    ],
  },
  "Military / Internal Operations": {
    summary: "Operational modernization and digital process improvements.",
    companyInfo: "Internal operations and safety-oriented systems contexts.",
    myTimeInfo: "Worked on modernization efforts and safer operational workflows.",
    roleSummary: "Operations modernization",
    color: "#f38ba8",
    tenureStart: "2010",
    tenureEnd: "2013",
    timelineRoles: [
      {
        label: "IT Operations Manager",
        start: "2010",
        end: "2013",
      },
    ],
  },
  "Quantum Vegas": {
    summary: "Convention buildout and event operations coordination.",
    companyInfo: "Event-focused production and systems coordination.",
    myTimeInfo: "Supported execution planning and buildout reliability.",
    roleSummary: "Event systems and delivery support",
    color: "#c4b5fd",
    tenureStart: "2022",
    tenureEnd: "2022",
    timelineRoles: [
      {
        label: "Event Technical Director",
        start: "2022",
        end: "2022",
      },
    ],
  },
  ShepherdTech: {
    summary: "Technology delivery across practical operations use cases.",
    companyInfo: "Applied technology partner for systems and process improvements.",
    myTimeInfo: "Delivered tooling and process outcomes for operational contexts.",
    roleSummary: "Applied systems delivery",
    color: "#22d3ee",
    tenureStart: "2024",
    tenureEnd: "Present",
    timelineRoles: [
      {
        label: "Fractional CTO / Technical Advisor",
        start: "2024",
        end: "Present",
      },
    ],
  },
  "VR Villa": {
    summary: "XR-oriented project delivery and environment build support.",
    companyInfo: "XR and immersive development context.",
    myTimeInfo: "Contributed to delivery flow and immersive project operations.",
    roleSummary: "XR project delivery",
    color: "#f5a65b",
    tenureStart: "2020",
    tenureEnd: "2022",
    timelineRoles: [
      {
        label: "XR Experience Designer",
        start: "2020",
        end: "2022",
      },
    ],
  },
};
