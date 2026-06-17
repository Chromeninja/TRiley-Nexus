---
name: role-targeting-mapper
description: Map portfolio projects to specific job targets and recommend featured ordering, project emphasis, and language changes for applications.
paths:
  - "README.md"
  - "portfolio-config.json"
  - "src/content/projects/*.md"
  - "src/content/companies/*.md"
---

## Purpose

Help tailor the portfolio to a target role without rewriting the whole site.

## Target role families

1. Senior Technical Program Manager
   Emphasize:
   - Ubisoft Help
   - Ubisoft refund flow
   - roadmap ownership
   - PRDs
   - acceptance criteria
   - stakeholder alignment
   - cross-functional estimation
   - release planning

2. Product Operations / Platform Operations
   Emphasize:
   - VR Villa Event Ops Manager
   - Discord Operations Platform
   - refund flow modernization
   - workflow automation
   - staff tooling
   - operating cadence
   - governance and visibility

3. Game Production / Live Ops Producer
   Emphasize:
   - Nope Challenge
   - VR Villa
   - Ubisoft Help
   - Jira
   - Perforce
   - QA coordination
   - community testing
   - release support

4. Community Platform Leadership
   Emphasize:
   - TEST Squadron Discord Operations Platform
   - Discord Governance
   - Event Coordinators Program
   - Bar Citizen
   - moderation systems
   - analytics
   - role management
   - privacy-conscious community operations

5. Operations Systems Builder
   Emphasize:
   - VR Villa Event Ops
   - Staffing and Payroll
   - Landing Zone Safety
   - Unit IT Operations
   - Ubisoft refund flow

## Output format

When given a target job or job description, return:

1. Best-fit positioning statement
2. Top 5 projects to feature
3. Projects to downplay
4. Keywords to add naturally
5. Summary rewrite recommendations
6. Any credibility risks
