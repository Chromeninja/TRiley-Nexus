export interface HomePrinciple {
  num: string;
  text: string;
}

export interface HomeStat {
  value: string;
  label: string;
}

import { siteConfig } from "./siteConfig";

export const homePrinciples: HomePrinciple[] = siteConfig.home.principles;

export const homeStats: HomeStat[] = siteConfig.home.stats;
