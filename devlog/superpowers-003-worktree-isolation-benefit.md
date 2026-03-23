# Superpowers-003 — Worktree Isolation: A Real Benefit

**Date:** 2026-03-22
**Framework:** superpowers (comparison observation)
**Phase:** Implementation

## Observation

The vanilla session started writing code directly to `main` in the shared repo. Its files (`vanilla/client/`, `vanilla/server/`, `vanilla/package.json`) immediately showed up in `git status` for other sessions — including this coordinator session and the superpowers session.

This is exactly the problem that the Superpowers `using-git-worktrees` skill exists to prevent. Phase 2 of the Superpowers workflow creates an isolated git worktree on a separate branch before any implementation begins. The benefits:

- **No cross-contamination** — each framework's work stays on its own branch until ready to merge
- **Clean rollback** — if something goes wrong, discard the worktree without touching main
- **Parallel safety** — multiple sessions can implement simultaneously without stepping on each other's files or commits

## What Happened in Practice

The Superpowers session hasn't reached the implementation phase yet (still in planning), so it hasn't actually created a worktree. But the vanilla session's direct-to-main approach is already demonstrating why isolation matters — we had to be careful not to accidentally commit vanilla's in-progress files in our devlog commit.

## Takeaway for the Course

Branch/worktree isolation isn't just best practice — it's a practical necessity when running multiple AI sessions against the same repo. Frameworks that enforce it (Superpowers) prevent a real class of problems that frameworks without it (vanilla) leave to the user to manage.
