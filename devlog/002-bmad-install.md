# 002 — BMAD Method v6 Installation

**Date:** 2026-03-21

## What Happened

Installed BMAD Method v6.2.0 into the `bmad/` subfolder via `npx bmad-method install`.

## Installation

- The installer is interactive (TUI with prompts for directory, module selection, etc.)
- Could not be run through Claude Code's bash tool — required direct terminal interaction via `! cd bmad && npx bmad-method install`

## What Got Installed

318 files, ~32K lines. Before any app code exists.

The framework installs the same skills three times — once for Claude Code (`.claude/skills/`), once for Cursor (`.cursor/skills/`), and once in a generic agent format (`.agent/skills/`). Cross-platform support means 3x file duplication for every skill.

### Key Skills

- `bmad-brainstorming` — structured ideation with multiple techniques
- `bmad-create-prd` — 12-step PRD creation workflow
- `bmad-party-mode` — multi-agent collaborative discussions
- `bmad-advanced-elicitation` — deeper requirement discovery
- Various review skills — adversarial review, edge case hunting, editorial review
- `bmad-distillator` — document compression
- `bmad-shard-doc` / `bmad-index-docs` — document management

Plus internal config: manifests, CSVs for project types and domain complexity, workflow definitions.

## Repo

Published to https://github.com/goggledefogger/magic-broom-chat (public, MIT license)
