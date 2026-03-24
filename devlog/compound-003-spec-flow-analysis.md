---
date: 2026-03-23
framework: compound
phase: spec review / flow analysis
---

# Compound 003: Spec Flow Analysis

## What Was Done

Ran a systematic flow analysis on the MVP requirements doc (`docs/brainstorms/2026-03-23-magic-broom-chat-mvp-requirements.md`) using the spec-flow-analyzer approach: grounded in the existing codebase (including BMAD's migration files as a reference implementation), mapped 7 user flows, and identified 14 gaps across critical/important/minor severity.

## Key Findings

### Critical Gaps
- **Private channel invite flow (R6)** is completely unspecified -- the single biggest blocker
- **#general channel seeding** is not addressed (who creates it? migration seed or dynamic?)
- **RLS for private channels** has a circular dependency (users need to see channels to join, but private channels should be invisible to non-members)

### Important Gaps
- Unread tracking mechanism undefined despite being a requirement (R9)
- Search "link to context" (R18) underspecified -- affects URL routing design
- No message pagination strategy
- Avatar source unresolved (email+password users have no avatar from auth provider)
- No mention of message editing/deletion (not in requirements OR scope boundaries)
- Channel name validation/uniqueness not addressed
- `channel_members.role` enum values undefined

### Cross-Framework Observations
- BMAD's implementation sidesteps private channels entirely (all channels visible to all users via permissive RLS)
- BMAD seeds #general via migration -- a pattern worth adopting
- BMAD does not enforce channel name uniqueness either -- this gap exists across frameworks

## Decisions Made
None yet -- this analysis produces questions for resolution before planning begins.

## Time/Effort
- Single-pass analysis grounded in both the compound spec and BMAD's existing schema
- 10 prioritized questions produced with default assumptions for each

## What's Next
Resolve the top 5 questions (private channel invite flow, avatar strategy, #general seeding, unread tracking, message edit/delete scope boundary) before proceeding to `/ce:plan`.
