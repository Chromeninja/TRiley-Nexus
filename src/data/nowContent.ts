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

import { siteConfig } from "./siteConfig";

export const nowLastUpdated = siteConfig.now.lastUpdated;

export const explorationItems: ExplorationItem[] = siteConfig.now.explorationItems;

export const priorityItems: PriorityItem[] = siteConfig.now.priorityItems;

export const openToItems = siteConfig.now.openTo;
