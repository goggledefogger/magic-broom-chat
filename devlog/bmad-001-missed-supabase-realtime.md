# BMAD-001 — Missed Supabase Realtime

**Date:** 2026-03-22
**Framework:** bmad
**Phase:** Architecture design

## Observation

Despite having both the BMAD framework and Context7 MCP available, the BMAD session didn't realize that Supabase has built-in Realtime WebSocket functionality — a key feature for a chat application.

This is notable because:
- Real-time messaging is a core MVP requirement listed in the kickoff prompt
- Supabase Realtime would eliminate the need for a custom WebSocket server (which is what vanilla built with Socket.IO)
- The Superpowers session *did* discover Supabase Realtime during its brainstorming and made it central to its architecture (no custom backend needed)
- Context7 was available to look up Supabase docs, but the connection wasn't made

## Pattern Emerging

This is the second framework to miss a Supabase capability — Superpowers missed the Supabase MCP server itself (see superpowers-002). Having tools available doesn't guarantee they'll be discovered or fully explored. Each session has blind spots, and they're different blind spots.

## Impact

Danny pointed out the Supabase Realtime capability and the BMAD session adjusted its architecture accordingly. This is a point in favor of the structured approach — the architecture phase was still early enough to incorporate the correction cleanly, before any code existed. If this had been vanilla (which was already built on Socket.IO by this point), the same correction would have required a rewrite.
