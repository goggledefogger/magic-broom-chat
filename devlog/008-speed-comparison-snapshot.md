# 008 — Speed Comparison Snapshot: All Three Frameworks

**Date:** 2026-03-22
**Framework:** cross-comparison
**Phase:** Mid-experiment observation

## The Contrast

At the same point in time, here's where each framework stands:

| | BMAD | Superpowers | Vanilla |
|---|---|---|---|
| **Output** | PRD (28 requirements, 4 user journeys, 3 phases) | Design spec (225 lines) + reviewed spec + implementation plan | Running app with all MVP features |
| **Artifacts** | 1 PRD + brainstorming doc | 3 design/planning documents | ~20 source files + database |
| **Tech stack** | Not yet chosen (PRD is tech-agnostic) | React + Vite + TailwindCSS + Supabase | React + Vite + TailwindCSS + Express + SQLite + Socket.IO |
| **Exchanges** | ~20+ (12-step PRD workflow + brainstorming) | ~15+ (clarifying questions, section approvals, spec review) | ~3 (tech stack + plan, then uninterrupted building) |
| **Phase** | Ready for architecture design | Ready to start implementation | Implementation complete |
| **Tests** | N/A | None yet (TDD planned) | None |
| **Spec/plan docs** | Business-oriented PRD | Technical design spec + plan | Bulleted list in chat |

## Three Different Starting Points

The frameworks don't just move at different speeds — they think about different things first:

- **BMAD** starts with *who* and *why* — user personas, user journeys, acceptance criteria, product phases. The PRD has 28 functional requirements across 7 capability areas but zero technical decisions. It hasn't chosen a tech stack yet because that's an architecture-phase concern.
- **Superpowers** starts with *how* — tech stack, data model, component structure, error handling strategy. The spec has exact table schemas and hook names but no user personas. It knows the database columns but not the user journeys.
- **Vanilla** starts with *what* — here's a plan, let's build it. Three exchanges to agree on a stack, then code.

## Different Tech Stack Paths

Given the same kickoff prompt:
- **BMAD** — hasn't chosen yet (deliberately deferred to architecture phase)
- **Superpowers** — Supabase (BaaS) — no custom backend, RLS for permissions, Supabase Realtime
- **Vanilla** — Express + SQLite + Socket.IO — full custom backend, session-based auth

The framework's process influenced the architecture. Superpowers' structured evaluation favored the simpler operational model (BaaS). Vanilla's "just build it" approach chose a traditional stack that's faster to scaffold. BMAD's separation of product from architecture means the tech stack will be chosen with the full PRD context available — potentially a more informed decision, but at the cost of more time.

## The Core Tradeoffs

**BMAD:** Most thorough product thinking, slowest to code. The 12-step PRD workflow felt heavy for a solo builder with clear vision (Danny was saying "continue" by step 3). But it caught things the others didn't — like deferring user presence from MVP, recovering 5 dropped brainstorming ideas during the polish step, and grounding features in narrative user journeys. Still hasn't written a line of code or chosen a database.

**Superpowers:** Middle ground on speed, strongest on technical design rigor. Has a reviewed spec with exact schemas, component trees, and a testing strategy. The spec review loop and Context7 doc verification add quality gates. But it's spent significant time on documents that largely describe what vanilla just... built.

**Vanilla:** Fastest to working software by a wide margin. No formal planning artifacts survive the session. The question is whether the speed advantage holds — will it need significant rework that the planning-heavy frameworks avoid? Or is "working code you can test" more valuable than "reviewed documents you can read"?

## Process Notes

- Vanilla wrote directly to `main` — its files appeared in `git status` for all other sessions. This is the exact scenario Superpowers' worktree skill prevents (see superpowers-003).
- Superpowers used Context7 MCP for doc verification; unknown if BMAD did (see superpowers-002).
- BMAD produced the most human-readable artifact (PRD with user journeys). Superpowers produced the most machine-actionable one (spec with exact file paths and schemas). Vanilla produced the most immediately useful one (working software).
