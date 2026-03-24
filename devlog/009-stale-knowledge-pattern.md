# 009 — Stale Knowledge Pattern: AI Using Outdated Approaches

**Date:** 2026-03-23
**Framework:** cross-comparison (observed in superpowers, bmad)
**Phase:** Teaching observation

## The Problem

Across multiple framework sessions, AI repeatedly chose older/inferior approaches even when newer, better options existed — sometimes from the same product/company it was already using.

### Concrete Example: Supabase Realtime

Supabase has modern Realtime features — **broadcast** and **presence** — purpose-built for exactly what a chat app needs. Instead, at least one session used the older **postgres_changes** approach (listening to database changes via Postgres replication). This works but is:
- Less efficient for real-time chat
- Not what Supabase themselves recommend for this use case
- An older pattern that predates the broadcast/presence features

Danny caught this because he already knew about the newer features. A student might not have.

## Why Didn't Context7 Help?

This is the puzzling part. The Superpowers session **actively used Context7** to look up library documentation — and still ended up with the older approach. Possible explanations:

1. **Context7's Supabase docs may not be current** — if the indexed docs don't cover broadcast/presence, the lookup returns the older patterns
2. **The model asked the wrong question** — Context7 returns what you ask for. If you search for "supabase realtime" you might get the general overview; if you search for "supabase postgres_changes" you get confirmation of the old approach
3. **Training data anchoring** — Opus's training data likely has more examples of postgres_changes (older, more blog posts) than broadcast/presence (newer). The model may reach for what it "knows" and use Context7 to confirm rather than discover
4. **No adversarial check** — neither framework prompted the model to ask "is there a newer/better way to do this?" The review loops checked spec quality and code correctness, but not whether the chosen approach was current

## The Broader Pattern

This isn't just a Supabase issue. It's a general risk with AI-assisted development:

- **Models default to what's in their training data**, which skews toward older, more-documented approaches
- **MCP doc lookups help but don't solve it** — you still need to know what to look up, and the indexed docs may lag behind releases
- **Framework review loops catch code quality issues but not technology currency** — none of the frameworks had a step like "verify this is the current recommended approach"
- **Human knowledge remains critical** — Danny caught this because he already knew. The frameworks didn't.

## Implications for Teaching

1. **Students should verify "is this the latest way?"** — especially for fast-moving tools like Supabase, Next.js, etc.
2. **Context7/MCP is helpful but not infallible** — the docs it indexes may be outdated too
3. **Framework review loops should include a currency check** — "is there a newer API or recommended pattern for this?"
4. **This is a concrete example of why human oversight matters** — AI can build the thing, but a knowledgeable human catches when it's building the thing the old way
