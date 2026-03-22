# Superpowers Plugin for Claude Code — Resource Guide

## What It Is

Superpowers is an agentic skills framework and software development methodology created by **Jesse Vincent** (GitHub: [obra](https://github.com/obra)) and his team at Prime Radiant. It's the most popular Claude Code plugin, available in the official Anthropic marketplace.

It turns best practices (TDD, code review, planning, verification) from suggestions into **mandatory gates**. The tradeoff is explicit: more time and tokens for higher quality output and fewer bugs.

## Installation

```
/plugin install superpowers@claude-plugins-official
/reload-plugins
```

Update with: `/plugin update superpowers`

## Core Philosophy

Four pillars:

1. **Test-Driven Development** — write tests first, always. No production code without a failing test.
2. **Systematic over Ad-Hoc** — process-driven, not guesswork. Every skill enforces a procedure.
3. **Complexity Reduction** — YAGNI ruthlessly. Simplicity is the primary goal.
4. **Evidence over Claims** — verify success before declaring completion. "Claiming work is complete without verification is dishonesty, not efficiency."

Skills are **mandatory, not suggestions**. The framework includes explicit anti-rationalization patterns — 11 common excuses Claude might use to skip skills, with counters for each. Vincent drew on Cialdini's persuasion principles (authority, commitment, social proof) to make skills "sticky."

## The 7-Phase Workflow

### Phase 1: Brainstorming

**Skill:** `superpowers:brainstorming`

Triggers before any creative work — creating features, building components, adding functionality, or modifying behavior. Has a hard gate: **no code until design is approved.**

- Asks clarifying questions **one at a time** (multiple choice preferred)
- Proposes 2-3 approaches with trade-offs and a recommendation
- Presents design in sections, getting approval after each
- Writes spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Runs an automated spec review loop via subagent (max 3 iterations)
- Has a visual companion feature (v5.0+) that can show mockups in a browser

**Key anti-pattern addressed:** "This is too simple to need a design." Every project goes through this.

### Phase 2: Git Worktrees

**Skill:** `superpowers:using-git-worktrees`

Creates an isolated workspace on a new branch after design approval.

- Smart directory selection: checks `.worktrees/` > `worktrees/` > `CLAUDE.md` preference > asks user
- Verifies the worktree directory is gitignored
- Runs project setup (auto-detects package.json, Cargo.toml, etc.)
- Verifies clean test baseline before starting

### Phase 3: Writing Plans

**Skill:** `superpowers:writing-plans`

Breaks implementation into **bite-sized tasks (2-5 minutes each)**.

- Each step is one action: "write the failing test" is a step, "run it to make sure it fails" is a separate step
- Plans include **exact file paths, complete code, exact commands with expected output**
- Written for an engineer with "zero context and questionable taste"
- Runs a plan review loop via subagent before execution

### Phase 4: Implementation (two options)

**Option A — Subagent-Driven Development (recommended):**
`superpowers:subagent-driven-development`

- Dispatches a **fresh subagent per task** with precisely crafted context (never session history)
- Two-stage review after each task: spec compliance first, then code quality
- Handles four implementer statuses: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED
- Model selection guidance: cheap models for mechanical tasks, capable models for architecture
- Key constraint: never dispatch multiple implementation subagents in parallel (conflicts)

**Option B — Executing Plans:**
`superpowers:executing-plans`

- Same-session execution with human checkpoints between batches
- Simpler but less quality control than subagent approach

### Phase 5: Test-Driven Development

**Skill:** `superpowers:test-driven-development`

Enforced throughout implementation.

- The "Iron Law": no production code without a failing test first
- If code is written before tests: **delete it, start over**. No keeping as "reference," no "adapting"
- Includes 11 rationalization patterns with explicit counters
- Companion file on testing anti-patterns covers mock misuse

### Phase 6: Code Review

**Skill:** `superpowers:requesting-code-review`

- Reviews work against the implementation plan between tasks
- Issues reported by severity
- Critical issues **block progress**

For receiving review feedback: `superpowers:receiving-code-review` — requires technical rigor and verification, not performative agreement or blind implementation.

### Phase 7: Finishing a Development Branch

**Skill:** `superpowers:finishing-a-development-branch`

- Verifies all tests pass
- Presents exactly 4 options: merge locally, create PR, keep as-is, discard
- Handles worktree cleanup
- Requires typed "discard" confirmation for destructive option

## Additional Skills

| Skill | When to Use |
|---|---|
| `systematic-debugging` | Any bug, test failure, or unexpected behavior. 4-phase root cause analysis. If 3+ fixes fail, question the architecture. |
| `verification-before-completion` | Before claiming work is complete. Must run verification command and show output. |
| `dispatching-parallel-agents` | 2+ independent tasks that can be worked on without shared state. |
| `writing-skills` | Creating new skills. Applies TDD to documentation — test skills with pressure scenarios. |

## How to Use It

You don't need slash commands. Just describe what you want to do and the relevant skill activates:

- "Let's brainstorm this feature" → triggers brainstorming
- "Help me plan the implementation" → triggers writing-plans
- "Let's debug this issue" → triggers systematic-debugging
- "I'm done, let's review" → triggers verification and code review

## Practical Tips

### What works well

1. **Lean into brainstorming, don't rush it.** The clarifying questions phase is where misunderstandings get caught cheaply.
2. **The spec and plan documents are the real artifacts.** They persist across sessions, can be reviewed by humans, and serve as the source of truth for subagents.
3. **Subagent-driven development preserves your context.** The controller stays focused on coordination while subagents do implementation with fresh context per task.
4. **Review the spec before the plan.** Catching design issues before implementation planning saves the most time.
5. **Use worktrees.** They prevent contaminating your main branch and give you a clean rollback path.

### Gotchas

1. **Token consumption is significantly higher.** Multiple users report 5-10x more tokens than direct Claude Code use. The subagent approach requires duplicate context across invocations.
2. **It slows things down.** The thorough process (brainstorm → spec → review → plan → review → implement → review) takes more wall-clock time. This is by design.
3. **Overkill for simple tasks.** Superpowers shines on multi-file features, not one-line fixes. Users pragmatically override for trivial work despite the "every project goes through this" language.
4. **Verbose output.** The design doc then the plan with actual code creates near-duplication.
5. **Long sessions cause drift.** On tasks lasting hours, agents can become "distracted." Fresh sessions help.
6. **Context window management matters.** Breaking work into focused tasks and using subagents (which get fresh context) mitigates this.

### Best practices from power users

- **Keep CLAUDE.md authoritative.** User instructions in CLAUDE.md override Superpowers skills. If you don't want TDD for a particular project, say so there.
- **Start with subagent-driven development** rather than inline execution. The two-stage review catches issues single-pass review misses.
- **For existing codebases**, the brainstorming skill explores current structure before proposing changes and follows existing patterns. Provide project conventions in CLAUDE.md.
- **Monitor `~/.config/superpowers/search-log.jsonl`** to see which skills Claude looked for but couldn't find — reveals gaps in your skill library.

## Superpowers vs. Vanilla Claude Code

| Aspect | Vanilla Claude Code | With Superpowers |
|---|---|---|
| Planning | Optional, ad-hoc | Mandatory brainstorm → spec → plan pipeline |
| Testing | Suggested | Enforced TDD with "Iron Law" |
| Code review | Manual | Automated two-stage review per task |
| Branch management | Manual | Automatic worktree creation and cleanup |
| Verification | Trust-based | Evidence-based — must run command before claiming success |
| Task granularity | Flexible | 2-5 minute bite-sized steps with exact code and commands |
| Context management | Single session | Subagents with isolated, curated context per task |
| Debugging | Ad-hoc | 4-phase systematic process with 3-fix architectural escalation |

## Links and References

- **GitHub:** https://github.com/obra/superpowers
- **Jesse Vincent's blog post:** "Superpowers: How I'm using coding agents" — https://blog.fsck.com/2025/10/09/superpowers/
- **Community guide:** https://st0012.dev/links/2026-01-15-a-claude-code-workflow-with-the-superpowers-plugin/
- **Review:** https://www.geeky-gadgets.com/claude-code-superpowers-plugin/
- **Beginner guide:** https://betazeta.dev/blog/claude-code-superpowers/
- **Complete guide:** https://pasqualepillitteri.it/en/news/215/superpowers-claude-code-complete-guide
