# 006 — Superpowers Brainstorming Resumed

**Date:** 2026-03-22
**Framework:** superpowers
**Phase:** Brainstorming (resumed in isolated session)

## What Happened

Resumed the Superpowers brainstorming in a dedicated Claude Code session scoped to `superpowers/` only. This isolates it from the other framework versions — the session has no awareness of `bmad/`, `compound/`, or `vanilla/`.

## Early Comparison Observation: Technical vs Business Focus

**Superpowers is noticeably more technical than BMAD in the brainstorming phase.**

- **BMAD** produced a business-oriented PRD: user personas, user stories, acceptance criteria, product requirements. The brainstorming felt like a product manager conversation.
- **Superpowers** jumped straight into architecture: tech stack selection, data model design (4 specific tables), application architecture patterns (SPA + BaaS vs custom backend), and component structure. The brainstorming feels like a senior engineer's design review.

Both frameworks asked clarifying questions before proposing solutions, but the *kind* of questions differed:
- BMAD asked about user needs, product goals, and scope priorities
- Superpowers asked about deployment preferences, real-time requirements, and tech stack constraints

This is a meaningful difference for the course — frameworks shape not just *how* you build but *what you think about first*.

## Process Notes

- The `superpowers/` subfolder already had `CLAUDE.md` (devlog rule) and `SUPERPOWERS_GUIDE.md` (full workflow reference) from the previous session
- Resuming required providing context about prior decisions since the new session had no memory of the previous one
- The brainstorming skill picks up mid-process smoothly when given enough context

## What's Next

Complete remaining design sections (UI layout, component structure, error handling, testing), write the spec document, run the automated review loop, then transition to implementation planning.
