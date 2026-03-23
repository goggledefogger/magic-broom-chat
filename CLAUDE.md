# Magic Broom Chat — AI Framework Comparison

This repo contains four versions of the same chat app, each built with a different AI-assisted development framework.

## Devlog Rule

After completing any major milestone (brainstorming, PRD, architecture, sprint planning, story implementation, etc.), **automatically** create a new numbered entry in `/devlog/` and update `/devlog/README.md` with a link to it.

Devlog entries should include:
- Date
- Which framework version (bmad, compound, superpowers, vanilla)
- What phase/step was completed
- Key decisions made (especially tech stack choices)
- Time/effort observations (how many back-and-forth exchanges, any friction)
- Anything surprising or noteworthy
- What's next

Use the naming pattern: `<framework>-NNN-short-description.md` (e.g., `bmad-003-prd.md`, `superpowers-002-spec.md`, `vanilla-001-kickoff.md`). Each framework uses its own prefix and numbering sequence to avoid collisions when multiple sessions write concurrently. Always check existing entries in `/devlog/` before picking a number to avoid duplicates within your prefix.

## Kickoff Prompt

See `KICKOFF_PROMPT.md` for the shared starting prompt used across all versions.
