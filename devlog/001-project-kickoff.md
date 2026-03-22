# 001 — Project Kickoff

**Date:** 2026-03-21

## What We're Doing

Building the same Zulip-like chat web app four different ways to compare AI-assisted development frameworks. Each one gets its own subfolder, its own tech stack choices, its own process. This devlog tracks how each one actually goes.

## The Four Approaches

1. **BMAD Method** — 12+ specialized agent personas, agile lifecycle, lots of upfront planning artifacts
2. **Compound Engineering** — cyclical brainstorm→plan→work→review loop, heavy on planning
3. **Superpowers** — mandatory TDD, 7 sequential phases, delegates tasks to subagents
4. **Vanilla Claude Code** — no framework, baseline for comparison

## Decisions

- Each framework picks its own tech stack — that's part of what we're comparing
- App concept: Zulip-inspired chat (channels, messages, auth, presence)
- This devlog tracks experiences, observations, and results across all four

## Observations

- All three frameworks are Claude Code plugins (skills), not UI frameworks — they help you think about what to build, not write the code
- They front-load effort differently: BMAD on architecture and personas, Compound on planning and review cycles, Superpowers on testing and verification
- Vanilla serves as the control group
