---
name: case-study-rewrite
description: Rewrite project markdown into stronger hiring-manager case studies with clear summary, highlights, problem, approach, outcome, skills, tools, and tags. Use when editing src/content/projects/*.md.
paths:
  - "src/content/projects/*.md"
---

## Purpose

Improve project markdown so each project reads like a concise portfolio case study.

## Required case study structure

For each project, strengthen these fields:

- `summary`: 1–2 sentences. Lead with what was delivered, for whom, and why it mattered.
- `cardSummary`: 1 recruiter-scan-friendly sentence.
- `highlights`: maximum 3 bullets. Use the strongest proof points.
- `problem`: what was broken, slow, risky, expensive, unclear, or difficult.
- `approach`: what Riley changed, built, coordinated, or operationalized.
- `outcome`: what improved. Put verified metrics first.
- `skills`: portable skills, not internal-only labels.
- `tools`: specific tools and platforms.
- `tags`: 4–6 concise tags.

## Case study logic

Use this internal structure:

1. One-line result
2. Context
3. Problem
4. Riley's role
5. Constraints
6. Approach
7. Outcome
8. Skills demonstrated

Condense that structure into the existing frontmatter fields unless the site clearly renders markdown body content well.

## Strong project examples in this repo

Treat these as high-priority case studies:
- Ubisoft Store & Ubisoft+ Refund Flow Modernization
- Ubisoft Help Roadmap & Customer Support Platform Delivery
- VR Villa Event Operations Program
- Discord Operations Platform
- Nope Challenge
- Landing Zone Safety
- Quantum Vegas / CitizenCon where relevant

## Writing rules

Use active voice.
Lead with outcomes.
Be specific about scope.
Preserve verified numbers.
Do not invent numbers.
Do not overstate sole ownership.
Prefer "led," "owned," "coordinated," "built," "standardized," "translated," and "operationalized" only when supported by the existing content.
