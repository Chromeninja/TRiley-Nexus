/**
 * Organization label utility functions for rendering company/org names in project cards
 * Provides intelligent abbreviation and fallback strategies for long organization names
 */

const organizationShortLabels: Record<string, string> = {
  "118th Air Support Operations Squadron": "118 ASOS",
  "235th Combat Airfield Operations Squadron": "235 CAOS",
  "878th Engineer Company": "878 EN CO",
  "Bar Citizen International": "BCI",
  "North Carolina National Guard Joint Force Headquarters": "NCNG JFHQ",
};

/**
 * Get display label for organization name
 * Attempts multiple strategies to create a label under maxChars:
 * 1. Check for predefined override
 * 2. Return as-is if under maxChars
 * 3. Remove common corporate suffixes
 * 4. Generate acronym
 * 5. Truncate with ellipsis as last resort
 *
 * @param value - Full organization name
 * @param maxChars - Maximum character limit for label
 * @returns Display-friendly organization label
 */
export function getOrganizationLabel(value: string, maxChars: number): string {
  const fullName = value.trim();
  const override = organizationShortLabels[fullName];
  if (override) {
    return override;
  }

  if (fullName.length <= maxChars) {
    return fullName;
  }

  const compactName = fullName
    .replace(
      /\b(International|Corporation|Company|Group|Systems|Solutions|Operations|Squadron|Services|Technologies|Technology|Institute|Organization)\b/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .trim();

  if (compactName.length > 0 && compactName.length <= maxChars) {
    return compactName;
  }

  const acronym = fullName
    .split(/[\s/&-]+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean)
    .map((part) => (/[0-9]/.test(part) ? part : (part[0]?.toUpperCase() ?? "")))
    .join("");

  if (acronym.length >= 2 && acronym.length <= maxChars) {
    return acronym;
  }

  return `${fullName.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
}
