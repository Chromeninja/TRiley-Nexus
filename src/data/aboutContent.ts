export interface AboutThinkItem {
  title: string;
  text: string;
}

export interface AboutPersonalItem {
  icon: string;
  title: string;
  body: string;
}

export interface AboutMediaItem {
  src: string;
  alt: string;
  caption?: string;
}

import { siteConfig } from "./siteConfig";

export const aboutBackgroundParagraphs: string[] = siteConfig.about.backgroundParagraphs;

export const aboutThinkItems: AboutThinkItem[] = siteConfig.about.thinkItems;

export const aboutPersonalItems: AboutPersonalItem[] = siteConfig.about.personalItems;

export const aboutValues: string[] = siteConfig.about.values;

// Optional hero photo on the About page; set to null in config to hide.
export const aboutProfileMedia: AboutMediaItem | undefined = siteConfig.about.profileMedia ?? undefined;

// Additional About media strip. Empty array means nothing is rendered.
export const aboutAdditionalMedia: AboutMediaItem[] = siteConfig.about.additionalMedia;
