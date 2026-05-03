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

export interface AboutResumeItem {
  title: string;
  filePath: string;
  lastUpdated: string;
  summary?: string;
}

export interface AboutContentData {
  metaDescription: string;
  backgroundParagraphs: string[];
  thinkItems: AboutThinkItem[];
  personalItems: AboutPersonalItem[];
  values: string[];
  profileMedia: AboutMediaItem | null;
  additionalMedia: AboutMediaItem[];
  resume?: AboutResumeItem;
}

import { getCollection } from "astro:content";
import { siteConfig } from "./siteConfig";

const fallbackAboutContent: AboutContentData = {
  metaDescription: siteConfig.about.metaDescription,
  backgroundParagraphs: siteConfig.about.backgroundParagraphs,
  thinkItems: siteConfig.about.thinkItems,
  personalItems: siteConfig.about.personalItems,
  values: siteConfig.about.values,
  profileMedia: siteConfig.about.profileMedia,
  additionalMedia: siteConfig.about.additionalMedia,
  resume: siteConfig.about.resume,
};

export async function getAboutContentData(): Promise<AboutContentData> {
  try {
    const entries = await getCollection("about");
    const entry = entries[0];

    if (!entry) {
      return fallbackAboutContent;
    }

    return {
      ...fallbackAboutContent,
      ...entry.data,
      additionalMedia: entry.data.additionalMedia ?? [],
      profileMedia:
        entry.data.profileMedia === undefined
          ? fallbackAboutContent.profileMedia
          : entry.data.profileMedia,
    };
  } catch {
    return fallbackAboutContent;
  }
}
