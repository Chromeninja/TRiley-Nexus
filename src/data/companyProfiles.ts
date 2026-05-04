import { getCollection } from "astro:content";
import { siteConfig } from "./siteConfig";

export type { CompanyProfile, CompanyTimelineRoleEntry } from "./siteConfig";

export async function getCompanyProfiles() {
	const fallbackProfiles = siteConfig.companies;

	try {
		const entries = await getCollection("companies");
		const mergedProfiles = entries.reduce(
			(accumulator, entry) => ({
				...accumulator,
				...entry.data.profiles,
			}),
			{},
		);

		return {
			...fallbackProfiles,
			...mergedProfiles,
		};
	} catch {
		return fallbackProfiles;
	}
}
