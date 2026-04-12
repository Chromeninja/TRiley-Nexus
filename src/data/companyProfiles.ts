export interface CompanyProfile {
  summary: string;
  companyInfo: string;
  myTimeInfo: string;
  tenureStart?: string;
  tenureEnd?: string;
}

export const companyProfiles: Record<string, CompanyProfile> = {
  Ubisoft: {
    summary:
      "Player-support, platform, and live-service program work across multiple Ubisoft surfaces and launches.",
    companyInfo:
      "Ubisoft is a global game publisher and live-service operator supporting large player communities across multiple titles, subscription products, and support platforms.",
    myTimeInfo:
      "From 2013 to 2024, I worked across Ubisoft support and platform operations, including Ubisoft Help improvements, R6Fix quality reporting, For Honor bug reporting workflows, Ubisoft+ launch support, GamePlan integration, Gear Store launch readiness, and automated refund flow operations.",
    tenureStart: "2013",
    tenureEnd: "2024",
  },
};
