# 005 — Superpowers Brainstorming Started

**Date:** 2026-03-21
**Framework:** superpowers
**Phase:** Brainstorming (in progress — paused partway through)

## What Happened

Installed Superpowers v5.0.5 via `/plugin install superpowers@claude-plugins-official`. Superpowers installs as a global plugin — no files added to the project folder (unlike BMAD which added 318 files).

Started the brainstorming skill using the same kickoff prompt as BMAD.

## Progress So Far

Completed:
- 5 clarifying questions (audience, deployment, tech stack preference, real-time needs, MVP definition)
- 3 architecture approaches proposed with visual comparison in browser
- Data model approved (4 tables: profiles, channels, channel_members, messages)
- Application architecture presented (React SPA + Supabase, no custom backend)

Still to do:
- Remaining design sections (UI layout, component structure, error handling, testing)
- Write spec document
- Spec review loop (subagent reviews, max 3 iterations)
- User review of written spec
- Transition to implementation planning

## Decisions Made

- **Tech stack:** React (Vite) + TailwindCSS + Supabase (Postgres + Auth + Realtime)
- **No custom backend server** — React talks directly to Supabase, Row Level Security handles permissions
- **Local-first development**, deploy later
- **Simpler real-time is fine** — Supabase Realtime over raw WebSockets
- **Audience:** Small, known group

## Process Observations

- Superpowers brainstorming asked 5 multiple-choice questions one at a time
- The visual companion showed architecture approaches as clickable cards in the browser. Danny selected option A (React + Supabase) by clicking in the browser, and the selection was recorded via an events file
- The brainstorming skill creates a task list upfront tracking each step of the process

## What's Next

Resume brainstorming — finish remaining design sections, write the spec, run the review loop, then transition to implementation planning.
