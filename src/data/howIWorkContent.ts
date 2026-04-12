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

import { siteConfig } from "./siteConfig";

export const coreApproachParagraphs: string[] = siteConfig.howIWork.coreApproachParagraphs;

export const workPrinciples: WorkPrinciple[] = siteConfig.howIWork.workPrinciples;

export const workStyleGroups: WorkStyleGroup[] = siteConfig.howIWork.workStyleGroups;

export const toolchainGroups: ToolchainGroup[] = siteConfig.howIWork.toolchainGroups;

export const aarIntro = siteConfig.howIWork.aar.intro;

export const aarQuestions: AARQuestion[] = siteConfig.howIWork.aar.questions;
