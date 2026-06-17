---
name: metrics-integrity-check
description: Check portfolio edits for invented metrics, unsupported claims, inflated ownership, inconsistent scale numbers, and stale dates. Use before committing content changes.
paths:
  - "README.md"
  - "portfolio-config.json"
  - "src/content/**/*.md"
  - "src/data/**/*.ts"
---

## Purpose

Protect the portfolio from credibility problems.

## Check for

1. Invented metrics
   - Do not allow new percentages, counts, dollar values, time savings, user counts, or performance claims unless they already exist in repo content or are explicitly provided by Riley.

2. Unsupported ownership
   - Flag claims that imply sole ownership if the source content only supports contribution, coordination, or support.

3. Inconsistent scale
   - Normalize TEST Squadron language:
     "40K-member Discord ecosystem tied to a roughly 24K-member Star Citizen organization."

4. Date freshness
   - Check resume last updated date.
   - Check Now page last updated date.
   - Flag stale or future-looking content that may confuse recruiters.

5. Vague claims
   - Flag language like "improved efficiency," "streamlined operations," or "optimized workflows" if no concrete mechanism or outcome is attached.

6. Risky military detail
   - Keep military operational details general.
   - Do not add sensitive tactics, procedures, locations, or mission-specific details.

## Output format

Return:

- Safe claims
- Claims needing evidence
- Claims to remove or soften
- Suggested safer wording
