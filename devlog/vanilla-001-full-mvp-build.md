# Vanilla-001: Full MVP Build

**Date:** 2026-03-22
**Framework:** vanilla (no framework)
**Phase:** Planning + Full Implementation

## What Happened

Built the complete Magic Brooms MVP in a single session with vanilla Claude Code — no planning frameworks, no skills, no agents. Just a quick tech stack discussion, a 7-phase plan outlined in chat, and straight into coding.

## Tech Stack Decisions

- **Frontend:** React 19 + Vite 8 + Tailwind CSS v4
- **Backend:** Node.js + Express 5 + Socket.IO 4
- **Database:** SQLite via better-sqlite3
- **Auth:** Express sessions + bcrypt
- **Structure:** Monorepo with npm workspaces (`client/` + `server/`)

## What Was Built

All MVP features implemented:
- User auth (register, login, logout, session persistence)
- Channels (create, join, browse, auto-join #general on signup)
- Real-time messaging via Socket.IO (send, receive, history loading)
- User presence (online/offline/idle with 5-min idle timer)
- Message search across all channels

## Key Observations

- **Speed:** Plan → working app in one continuous flow. No brainstorming phases, no spec documents, no review loops.
- **Exchanges:** 3 exchanges to agree on tech stack + plan, then uninterrupted building.
- **Friction:** Minimal. The only pause was the user clarifying they didn't want the superpowers skill framework.
- **Trade-off:** No spec document to review, no formal design phase. The plan was a bulleted list in chat. For an MVP this size that's fine; for a larger project it might not be.

## What's Next

- Test the app end-to-end in a browser
- Polish any rough edges found during testing
- Compare this experience with the other framework versions
