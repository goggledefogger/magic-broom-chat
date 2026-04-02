# 004 — BMAD PRD Complete

**Date:** 2026-03-21
**Framework:** bmad
**Phase:** PRD Creation (12-step workflow)

## What Was Completed

Created the full Product Requirements Document for Magic Brooms using the `bmad-create-prd` skill — a 12-step facilitated workflow. The output is at `bmad/_bmad-output/prd.md`.

## How It Went — Honest Assessment

### The Good

The BMAD PRD workflow did its job: it forced structured thinking through steps that a human would likely skip. The classification step (web app, edtech, medium complexity) seemed trivial but set useful guardrails. The scoping step caught a real decision — deferring user presence from MVP — that might have stayed in scope unchallenged otherwise.

The brainstorming reconciliation during the polish step was genuinely valuable. Five ideas from the earlier brainstorming session had silently dropped out during the structured PRD steps because they were "soft" ideas (design philosophy, meta-learning, feel) that don't map cleanly to functional requirements. The workflow caught that and gave Danny the choice to track them.

The user journeys came out strong. Four narrative-driven stories that ground the features in real scenarios — a new student discovering resources, a mid-course student going from lurker to contributor, an instructor replacing email with gallery posts, an alumnus staying loosely connected. These will be useful for architecture and UX decisions downstream.

### The Friction

**It's long.** 12 steps with menus at each one. Danny started saying "c" (continue) almost immediately by step 3, and by step 8 said "continue all" to accelerate through the remaining steps. The A/P/C menu (Advanced Elicitation / Party Mode / Continue) was presented at every step but never used — Danny always chose Continue. For a product where the builder already has clear vision, the workflow's deliberate pacing felt like overhead rather than value.

**The append-only architecture creates mess.** Each step appends content to the document, which means by step 8 there were two different scope sections saying slightly different things (one listed user presence as MVP, the other correctly deferred it). The polish step exists to fix this, but it's a design smell — the workflow creates problems it then has to clean up.

**Some steps felt redundant.** The early "Product Scope" (step 3) and the later "Project Scoping & Phased Development" (step 8) covered nearly the same ground. The domain requirements step was skippable (medium complexity edtech doesn't need deep domain analysis). The innovation step was also light — Danny said "yes but no need to focus much on this." Three of 12 steps were essentially acknowledged and passed through.

**The facilitator persona is a bit much.** The workflow insists on treating the user as a "PM peer" with "collaborative dialogue" at every step. Danny is the product owner, knows what he wants, and communicated efficiently. The ceremonial framing ("Welcome Danny! I've set up your PRD workspace...") added words without adding value.

### Danny's Experience

Danny engaged most deeply during the vision discovery (step 2b) and success criteria (step 3) — these were genuine conversations where new ideas emerged (resource sharing as the core problem, the hype video concept, lo-fi/glitchy aesthetic for generated content, A Portland Career brand alignment). He gave clear, decisive answers on scoping and was comfortable deferring features.

He pushed back on tone once — the Sorcerer's Apprentice theme should be "adult and mystical, not childish" — which was an important clarification that would have been easy to miss. He also corrected the framing around long processes: don't call them "never-ending," say "they're valuable steps, here's the bigger picture." That's a signal about how he wants to work — direct, no hand-wringing about process.

By the end, he was clearly ready to move on. The PRD is solid, but the workflow could have arrived at the same output in fewer steps with less ceremony for a user who has clear product vision.

### Framework Observations (for the comparison)

- BMAD's PRD workflow is **thorough but heavy** — 12 steps, ~318 files of framework scaffolding before any app code exists
- The structured approach prevents skipping important thinking (scoping, brainstorming reconciliation) but also prevents skipping unimportant steps
- The append-only document building is a liability — it creates inconsistencies that the polish step has to fix
- The A/P/C menu system (Advanced Elicitation / Party Mode / Continue) was never used beyond Continue — for a solo builder, the multi-agent collaboration features are overhead
- The CSV-driven classification (project types, domain complexity) is a nice touch — it loads relevant context without the user having to know what's relevant

**Overall verdict:** The PRD output is good. The process to get there had more friction than necessary for this use case. The question for the comparison is whether the structured thoroughness pays off downstream (in architecture and implementation) enough to justify the upfront cost.

## Key Decisions

- Gallery-first resource sharing is the MVP differentiator
- User presence deferred from MVP (not needed for ~20 students)
- No topic threading in MVP
- Sorcerer's Apprentice theme: adult, mystical, minimalist — not Disney
- Experience MVP strategy — "the minimum that makes students say 'this is where I want to be'"
- Danny and Dan as co-instructors with instructor admin roles
- App UI aligned with A Portland Career brand; lo-fi/glitchy aesthetic only for generated video content

## PRD Contents

- 28 functional requirements across 7 capability areas
- 4 user journey narratives
- 3 development phases (MVP → Growth → Expansion) plus Vision backlog
- 5 dropped brainstorming ideas recovered and tracked in Vision tier
- Non-functional requirements: performance, security, scalability, accessibility, reliability

## What's Next

- Architecture design using BMAD's architecture workflow
- Or: start one of the other framework versions (compound, superpowers, vanilla) for comparison
