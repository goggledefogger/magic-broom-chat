---
title: "feat: Polished Slack-like Chat MVP"
type: feat
status: active
date: 2026-03-30
origin: ~/.gstack/projects/goggledefogger-magic-broom-chat/Danny-feat/compound-mvp-design-20260329-221725.md
---

# feat: Polished Slack-like Chat MVP (gstack version)

## Overview

Build the gstack version of Magic Broom Chat as a visually polished, Slack-like web app. Same MVP features as the four existing versions (auth, channels, real-time messaging, presence, search) but with the design quality cranked up: Framer Motion animations, optimistic updates, skeleton loading states, message grouping, Cmd+K command palette, and animated typing indicators. Reuses compound's Supabase backend (same project, same schema). The differentiator is **design quality**, not features.

## Problem Statement / Motivation

This is the fifth framework in a comparison experiment for an educational course on AI-assisted development. The other four versions prove the app works. This one proves it can look and feel like a real product. Students should see this version side-by-side with the others and immediately notice the design quality gap.

## Proposed Solution

React 19 + Vite 8 + Tailwind CSS 4 + shadcn/ui + Framer Motion + Supabase. Slack-like aesthetic with aubergine sidebar, message grouping, animated transitions, and skeleton loading states. Copy compound's Supabase config (same project URL + anon key) and database types, but build the entire frontend fresh with better components and polish.

## Technical Considerations

### Architecture (mirrors compound, with additions)

```
gstack/src/
├── main.tsx                    # Entry + router
├── App.tsx                     # Route definitions
├── lib/
│   ├── supabase.ts             # Supabase client (same config as compound)
│   ├── database.types.ts       # Copy from compound (generated from same schema)
│   └── utils.ts                # cn() helper
├── contexts/
│   └── AuthContext.tsx          # Auth state + profile
├── hooks/
│   ├── useChannels.ts          # Channel CRUD + subscription
│   ├── useMessages.ts          # Messages + optimistic updates + real-time
│   ├── usePresence.ts          # Supabase Presence for online/idle/offline
│   ├── useTyping.ts            # Broadcast-based typing indicators
│   └── useSearch.ts            # Full-text search via search_messages RPC
├── components/
│   ├── ui/                     # shadcn/ui components (button, dialog, command, etc.)
│   ├── auth/                   # LoginForm, SignUpForm, AuthPage
│   ├── layout/
│   │   ├── AppShell.tsx        # Sidebar + main area layout
│   │   └── AuthGuard.tsx       # Redirect if not authenticated
│   ├── channels/
│   │   ├── ChannelSidebar.tsx  # Aubergine sidebar with channel list + DMs
│   │   ├── ChannelView.tsx     # Channel header + message list + input
│   │   ├── ChannelBrowser.tsx  # Browse/join channels
│   │   └── CreateChannelDialog.tsx
│   ├── messages/
│   │   ├── MessageList.tsx     # Scrollable list with Framer Motion entrance
│   │   ├── MessageItem.tsx     # Avatar + name + timestamp + grouping
│   │   ├── MessageInput.tsx    # Input with send button
│   │   └── TypingIndicator.tsx # Animated bouncing dots
│   ├── presence/
│   │   └── OnlineUsers.tsx     # Presence dots (green/yellow/gray)
│   └── search/
│       ├── SearchPage.tsx      # Full-text search results
│       └── CommandPalette.tsx  # Cmd+K channel switcher (NEW)
└── index.css                   # Tailwind imports + Slack color tokens
```

### Institutional Learnings (from 4 prior builds)

These are real bugs hit by the other versions of this exact app. Apply all of them:

1. **Broadcast subscription ordering**: Subscribe to channels BEFORE sending. Broadcasts silently fail if the recipient isn't subscribed yet. (BMAD bug)
2. **PostgREST FK hints**: Messages→profiles joins need an explicit FK from `messages.user_id` to `profiles(id)` and FK hints in query syntax: `profiles!messages_user_id_fkey(*)`. Already in compound's schema.
3. **Presence cleanup is unreliable**: Don't write "offline" status in React cleanup functions. Let Supabase Presence handle ephemeral state. The `.update()` call without `.then()` is a no-op.
4. **shadcn/ui path alias**: Verify `npx shadcn add` writes to the correct path, not a literal `@/` directory.
5. **Separate vite.config.ts and vitest.config.ts**: Vite 8 and Vitest have type conflicts when combined.
6. **Verify Supabase Realtime API currency**: AI defaults to older `postgres_changes` patterns. Compound uses Broadcast for messages (with DB triggers), which is correct for this use case.
7. **Schema-first**: Copy compound's database.types.ts rather than hand-writing types. Generated types avoid `never` type errors.

### Key Design Decisions

- **Optimistic updates**: Use crypto.randomUUID() for temp client IDs. On broadcast receipt, deduplicate by matching `user_id + content + pending` flag (compound's pattern, proven working).
- **Message grouping**: Consecutive messages from same user within 5 min window collapse (hide avatar + name).
- **Animations**: Framer Motion `AnimatePresence` for message entrance, `layout` prop for smooth reflows, spring animations on unread badges.
- **Command palette**: shadcn/ui `CommandDialog` component for Cmd+K channel switching. Near-zero effort.
- **Skeleton loaders**: Custom skeleton components for channel list and message list during initial load.

## System-Wide Impact

- **Interaction graph**: Auth change → re-subscribe all channels. Channel switch → unsubscribe old, subscribe new. Message send → optimistic insert → DB insert → broadcast → deduplicate.
- **Error propagation**: Supabase errors surface as toast notifications. Failed messages show inline retry. Expired sessions redirect to login.
- **State lifecycle risks**: Optimistic messages could orphan if browser closes mid-send. Acceptable for MVP.
- **API surface parity**: Same Supabase backend as compound, no schema changes needed.

## Acceptance Criteria

### Functional Requirements

- [ ] User can sign up with email/password
- [ ] User can log in and log out
- [ ] User can browse, create, and join channels
- [ ] User can send and receive messages in real-time
- [ ] Messages appear optimistically (instant feedback)
- [ ] User presence shows online/offline status
- [ ] Typing indicators appear when others are typing
- [ ] Full-text search works across all messages
- [ ] Cmd+K opens command palette for channel switching

### Design Quality Requirements

- [ ] Aubergine sidebar matching Slack aesthetic
- [ ] Consecutive messages from same sender group together
- [ ] Messages animate in with Framer Motion
- [ ] Skeleton loading states (no bare spinners)
- [ ] Empty states with helpful messages
- [ ] Error states with retry actions
- [ ] Typing indicator with animated bouncing dots
- [ ] Unread badge counts on channels
- [ ] Smooth channel transitions

## Success Metrics

- Side-by-side with compound version, the design quality gap is immediately visible
- All 5 MVP features work end-to-end
- No layout shifts or animation jank
- Every state (loading, empty, error, success) has a designed treatment

## Dependencies & Risks

- **Supabase backend**: Must be running with compound's schema. Same env vars.
- **shadcn-chat compatibility**: May not work with React 19. Fallback: build custom ChatBubble/ChatInput with shadcn/ui primitives (adds ~15-30 min).
- **Framer Motion bundle size**: ~30KB gzipped. Acceptable for this use case.

## Sources & References

### Origin

- **Design doc**: `~/.gstack/projects/goggledefogger-magic-broom-chat/Danny-feat/compound-mvp-design-20260329-221725.md` — approved 2026-03-29. Key decisions: Slack aesthetic, shadcn/ui + shadcn-chat + Framer Motion, same Supabase backend as compound.

### Internal References

- Compound hooks: `compound/src/hooks/useMessages.ts` (optimistic update pattern)
- Compound presence: `compound/src/hooks/usePresence.ts` (Supabase Presence pattern)
- Compound typing: `compound/src/hooks/useTyping.ts` (Broadcast pattern)
- Database types: `compound/src/lib/database.types.ts` (copy this)
- Compound layout: `compound/src/components/layout/AppShell.tsx` (two-pane layout)

### Devlog Learnings

- `devlog/bmad-006-playwright-testing-and-bugfix.md` — PostgREST FK hints, Broadcast subscription ordering
- `devlog/superpowers-006-code-review-fixes.md` — Presence cleanup unreliability
- `devlog/compound-005-full-mvp-implementation.md` — shadcn/ui path alias, schema-first approach
- `devlog/009-stale-knowledge-pattern.md` — AI uses stale Supabase patterns
