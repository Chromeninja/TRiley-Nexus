export interface HomePrinciple {
  num: string;
  text: string;
}

export interface HomeStat {
  value: string;
  label: string;
}

export const homePrinciples: HomePrinciple[] = [
  {
    num: "01",
    text: "Diagnose before designing - understand the real problem, not just the stated one.",
  },
  {
    num: "02",
    text: "Build systems, not solutions - make it repeatable, not just functional once.",
  },
  {
    num: "03",
    text: "Align people before automating process - technology amplifies what's already there.",
  },
  {
    num: "04",
    text: "Create clarity in ambiguity - my job is to reduce uncertainty for everyone around me.",
  },
  {
    num: "05",
    text: "Balance strategy and execution - think at both levels simultaneously.",
  },
];

export const homeStats: HomeStat[] = [
  { value: "8+", label: "Years military service" },
  { value: "5K+", label: "Community members managed" },
  { value: "40+", label: "Operations planned & executed" },
  { value: "12+", label: "Large-scale events run" },
];
