export interface CareerAtlasEraDefinition {
  label: string;
  start: string;
  end: string;
  theme: string;
}

export const careerAtlasEras: CareerAtlasEraDefinition[] = [
  {
    label: "Early Career",
    start: "2010",
    end: "2014",
    theme: "Foundation and operational depth",
  },
  {
    label: "Leadership Growth",
    start: "2015",
    end: "2019",
    theme: "Program ownership and cross-team delivery",
  },
  {
    label: "XR / VR Work",
    start: "2020",
    end: "2022",
    theme: "Immersive systems and applied interaction design",
  },
  {
    label: "Community Building",
    start: "2021",
    end: "2024",
    theme: "Player ecosystems, moderation, and operations",
  },
  {
    label: "Independent Projects",
    start: "2023",
    end: "Present",
    theme: "Personal products and experimentation",
  },
];
