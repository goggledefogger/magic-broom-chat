# 002 — BMAD Method v6 Installation

**Date:** 2026-03-21

## What Happened

Installed BMAD Method v6.2.0 into the `bmad/` subfolder via `npx bmad-method install`.

## Installation Experience

- The installer is interactive (TUI with prompts for directory, module selection, etc.)
- Could not be run through Claude Code's bash tool — required direct terminal interaction
- The user had to run it manually via `! cd bmad && npx bmad-method install`

## What Got Installed

BMAD v6 installed a substantial amount of scaffolding (318 files, ~32K lines):

- `.agent/skills/` — Agent-platform-agnostic skill definitions
- `.claude/skills/` — Claude Code-specific skill copies
- `.cursor/skills/` — Cursor-specific skill copies (cross-platform support)
- `_bmad/` — Core framework internals, configs, manifests

### Key Skills Available

- `bmad-help` — Entry point, contextual guidance
- `bmad-brainstorming` — Structured ideation with multiple techniques
- `bmad-create-prd` — 12-step PRD creation workflow
- `bmad-party-mode` — Multi-agent collaborative discussions
- `bmad-advanced-elicitation` — Requirement elicitation methods
- `bmad-distillator` — Document compression/optimization
- `bmad-editorial-review-prose` / `bmad-editorial-review-structure` — Review workflows
- `bmad-review-adversarial-general` / `bmad-review-edge-case-hunter` — Adversarial review
- `bmad-shard-doc` — Document sharding
- `bmad-index-docs` — Documentation indexing

## Observations

- Heavy upfront scaffolding — lots of files before any app code exists
- Cross-platform design (Claude, Cursor, generic agent) means 3x duplication of skill files
- The framework is clearly designed for structured, multi-phase development
- Next step: use `bmad-help` to understand the recommended workflow for starting a new project

## Repo

Published to https://github.com/goggledefogger/magic-broom-chat (public, MIT license)
