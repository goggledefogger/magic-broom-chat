# 001 — Project Kickoff

**Date:** 2026-03-21

## Decision

Set up a comparison experiment: build the same Zulip-like chat web app using four different AI-assisted development approaches, each in its own subfolder.

## Frameworks Selected

1. **BMAD Method** — 12+ specialized agent personas, agile lifecycle, scale-adaptive planning
2. **Compound Engineering** — Cyclical brainstorm→plan→work→review→compound loop, heavy upfront planning
3. **Superpowers** — Mandatory TDD (red-green-refactor), 7 sequential phases, subagent-driven tasks
4. **Vanilla Claude Code** — No framework, baseline for comparison

## Key Decisions

- Each framework chooses its own tech stack — stack selection is part of what we're comparing
- App concept: Zulip-like chat (channels/topics, threaded messages, user presence, auth)
- This devlog tracks experiences, observations, and results across all four

## Open Questions

- Which framework to start with?
- Run sequentially or in parallel?
- What's the minimum viable feature set for a fair comparison?

## Observations

- All three frameworks (BMAD, Compound, Superpowers) are Claude Code plugins, not UI frameworks
- They differ most in where they front-load effort: BMAD → architecture/personas, Compound → planning/review, Superpowers → testing/verification
- Vanilla serves as the control group
