---
title: 'Cohort Archive Fixes — channel routing, rename, thread loading, scroll bug'
slug: 'cohort-archive-fixes'
created: '2026-04-09'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - React 19 + TypeScript + Vite (ESM, `import.meta.env` for browser)
  - shadcn/ui (version 4.1.0 — NOT the old `shadcn-ui` package)
  - "@base-ui/react" primitives (ScrollArea uses BaseUI, not Radix)
  - Supabase (Postgres, auth, RLS) — prod project `gwcuxnlhgquchuimuxrk`
  - TanStack Query v5 (data fetching + invalidation-driven realtime)
  - Supabase Realtime via `postgres_changes` subscriptions
  - tsx + date-fns-tz (ingest script runtime)
files_to_modify:
  - bmad/app/scripts/ingest/writer/write-entries.ts
  - bmad/app/scripts/ingest/writer/session-roots.ts
  - bmad/app/src/features/channels/ThreadPanel.tsx
  - bmad/app/src/features/channels/ChatView.tsx
  - bmad/app/src/components/ui/skeleton.tsx (NEW, via shadcn add)
code_patterns:
  - Factory functions returning `{ method, stats }` for stateful resolvers (ghost-users, session-roots)
  - TanStack Query hooks with realtime subscription side-effects in `useEffect`
  - ScrollArea children wrapped with `<div className="py-*">...` + trailing `<div ref={bottomRef} />`
  - Hardcoded constants in CLI entrypoint (ingest-meet-chat.ts), pass-through via config object
test_patterns:
  - Vitest with `@vitest-environment node` for pure-Node unit tests
  - Parser/writer functions unit-tested; SQL + Supabase interactions tested via the live ingest verification flow
  - No integration/e2e test framework in place (manual browser + SQL verification)
---

# Tech-Spec: Cohort Archive Fixes — channel routing, rename, thread loading, scroll bug

**Created:** 2026-04-09

## Overview

### Problem Statement

The Meet chat backfill ingest (PR #10, merged 2026-04-09) successfully imported 48 messages, 6 session roots, and 18 gallery cards into prod — but three issues surfaced once Danny viewed the result in `magic-brooms.vercel.app`:

1. **Wrong channel.** Messages and the six session thread roots all landed in `#general`, but the content is cohort 2 class chat and belongs in `#cohort-2` (a standard channel that exists on prod but was not in the original seed migration, so the ingest author never learned about it). Gallery cards in `#resources` are correct and stay.
2. **Confusing naming.** The imported bot profile is named `Meet Archive (imported)` and the session root messages read `📅 Meet chat — Mar 24, 2026 session`. The word "Meet" is ambiguous (meeting? verb "meet"?). It should be `Class Archive (imported)` and `📅 Class session — Mar 24, 2026`.
3. **Thread sidebar UX regressions.** Clicking a reply-count button opens `ThreadPanel`, but:
   - Loading state is a bare `"Loading replies..."` text that feels slow and unfinished while the query is in flight.
   - After the panel opens, the main chat body loses upward scroll — Danny can't scroll up in the main messages list once the sidebar is visible.

### Solution

Four coordinated changes, each small and independently verifiable:

1. **Data migration (prod).** Run a SQL `UPDATE` against prod Supabase (via Management API with the PAT, same path used for migration 00012) that:
   - Moves all `messages` rows whose `id` is in `(SELECT message_id FROM message_imports WHERE import_batch_id = '2026-04-09-backfill' AND message_id IS NOT NULL)` from `#general` to `#cohort-2`.
   - Renames the imported-bot profile `display_name` from `Meet Archive (imported)` to `Class Archive (imported)`.
   - Updates the content of the 6 session-root messages from `📅 Meet chat — <date> session` to `📅 Class session — <date>`. Identify root messages via `(SELECT message_id FROM message_imports WHERE source = 'google-meet-email-root')`.
   - Ensures the `Class Archive (imported)` bot is a member of `#cohort-2` via `channel_members` upsert.
   - Gallery cards are untouched (already correct in `#resources`).
2. **Ingest script update (code).** Change `bmad/app/scripts/ingest/ingest-meet-chat.ts` constants:
   - Add a `SESSION_DATE_TO_CHANNEL` map (for now, every date → `'cohort-2'`, but structured so future sessions can route per-date).
   - Update `ingest-meet-chat.ts` + `writer/write-entries.ts` + `writer/session-roots.ts` to use the map + new naming.
   - Bot display_name constant → `'Class Archive'` (the resolver appends `(imported)`).
   - Root-message content format → `📅 Class session — <pretty date>`.
   - **Fingerprint source tags stay unchanged** (`'google-meet-email'` / `'google-meet-email-root'`) to preserve idempotency on re-runs.
3. **ThreadPanel skeleton loader.** Replace the bare text at `ThreadPanel.tsx:106-108` with a shadcn `Skeleton` component: 2-3 placeholder rows each with a circular avatar placeholder + two text-line placeholders, matching the existing `ThreadMessage` layout.
4. **Scroll regression root-cause fix.** Both `ThreadPanel.tsx:61-63` and `ChatView.tsx:339-341` call `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })`. The default `block: 'start'` causes `scrollIntoView` to traverse to the **nearest scrollable ancestor**, which — in Radix `ScrollArea` — is the inner viewport div. BUT: when the ThreadPanel mounts, its `useEffect` fires with an initially-undefined `replies` and then again once replies load. On the first fire, `bottomRef` may be in the DOM but its Radix viewport parent's scroll context may not yet be initialized, causing the browser to walk up to the next scrollable ancestor (possibly the body or the flex-row container). Fix: use the ScrollArea viewport's `scrollTop` directly (via a ref to the viewport) or call `scrollIntoView({ block: 'nearest', inline: 'nearest' })` to scope the scroll. Apply the same fix in ChatView for consistency.

### Scope

**In Scope:**

- SQL data migration of existing Meet chat rows on **prod Supabase** (`gwcuxnlhgquchuimuxrk`) — channel reroute, bot rename, root message content rewrite, channel membership update.
- Code update to `ingest-meet-chat.ts` + related writer files so re-running the ingest (or a future ingest) writes to `#cohort-2` with the new naming.
- `ThreadPanel.tsx` skeleton loader using shadcn `Skeleton`.
- Root-cause fix for the main-body scroll regression when ThreadPanel mounts. Apply consistent treatment in both `ThreadPanel.tsx` and `ChatView.tsx`.
- Verification after each change: SQL counts, visual eyeball of thread panel loading, scroll behavior test.

**Out of Scope:**

- Changing `message_imports.source` column values (fingerprint stability).
- Rerouting gallery cards (already in `#resources` correctly).
- Re-running the full ingest (SQL migration is sufficient; re-running would double-ingest unless rolled back first).
- Broader ThreadPanel refactoring (e.g., composer UX, thread reply layout).
- Creating new channels, new migrations beyond 00012.
- Changing the realtime subscription / TanStack Query setup.
- Local Supabase — only prod gets the data fix (local will naturally pick up the code changes next time Danny runs the ingest there).

## Context for Development

### Codebase Patterns

- **Fetch data via TanStack Query hooks** (`useMessages`, `useThreadMessages`, `useThreadReplyCounts` — all defined in `src/hooks/useMessages.ts`). Use `isLoading` from the hook's result for loading states; don't add a new loading primitive.
- **shadcn/ui v4**: the project uses the *new* shadcn CLI (package name `shadcn`, version `4.1.0` in `package.json`). Add components with `npx shadcn@latest add <name>` (NOT `npx shadcn-ui@latest`, which is the deprecated package). Existing components all live under `bmad/app/src/components/ui/*.tsx`.
- **BaseUI ScrollArea, not Radix**: `src/components/ui/scroll-area.tsx` wraps `@base-ui/react/scroll-area` primitives — `Root` → `Viewport` → children. The outer `<ScrollArea>` forwards props to `ScrollAreaPrimitive.Root.Props`, which means `ref={scrollRef}` attaches to Root, NOT Viewport. The scrollable element is the Viewport. To scroll programmatically, either (a) render a child ref near the bottom and call `scrollIntoView({ block: 'nearest' })`, or (b) introduce a viewport-targeting ref via `ScrollAreaPrimitive.Viewport` directly.
- **Scroll patterns in ChatView/ThreadPanel (current, buggy)**: both use `<div ref={bottomRef} />` placed at the end of ScrollArea children, with a `useEffect` that calls `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })` on `messages?.length` / `replies?.length` dep change. Problem: default `block: 'start'` with `behavior: 'smooth'` traverses the scrollable ancestor chain, and during mount + async data load the target ancestor can be ambiguous, leading to cascading/repeating scroll animations that fight the user's attempts to scroll up.
- **Main layout overflow guard**: `AppLayout.tsx:389` has `<main className="flex-1 overflow-hidden">`. This clips any scroll escape, BUT it means if `scrollIntoView` tries to scroll the main element, the browser accepts the call silently while `overflow-hidden` prevents visible movement. This does not prevent scroll intent from firing repeatedly.
- **Realtime invalidation pattern**: `useMessages` (line 55-77 of `src/hooks/useMessages.ts`) subscribes via `supabase.channel('messages:${channelId}').on('postgres_changes', { event: '*', ..., filter: 'channel_id=eq.${channelId}' })`. On ANY change including thread replies, it invalidates `['messages', channelId]` AND `['thread-reply-counts', channelId]`. Top-level messages query filters with `.is('parent_id', null)`, so thread-reply inserts don't change the returned set — `messages?.length` shouldn't change. This is NOT the root cause of the scroll bug, but understanding it is important for the fix.
- **Channel membership changes from admin flows** happen via `channel_members` upsert with `onConflict: 'channel_id,user_id', ignoreDuplicates: true` — the same pattern used in `writer/ghost-users.ts:ensureMembership`. Reuse this pattern when ensuring the `Class Archive` bot is a member of `#cohort-2`.
- **Management API SQL execution**: Use `POST https://api.supabase.com/v1/projects/{ref}/database/query` with a Bearer PAT token. PAT is stored in macOS Keychain under service `Supabase CLI`, account `supabase`, accessible via `security find-generic-password -s "Supabase CLI" -a "supabase" -w` — the value is `go-keyring-base64:<base64>`; strip the prefix and base64-decode to get the raw PAT. Only the CLI-host machine can do this (it's local to Danny's Mac).
- **Fingerprint immutability**: `message_imports.source_fingerprint` is sha256 over `(source | session_date | author_raw | timestamp_raw | sha256(content))`. Changing the `source` column value on existing rows would orphan idempotency; leave `source` alone and let it remain `'google-meet-email'` / `'google-meet-email-root'`.
- **Gallery cards unaffected**: the 16 inserted cards + 2 deduped already live in `#resources` (the correct channel for them). No gallery-card rows touched in this fix.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `bmad/app/scripts/ingest/ingest-meet-chat.ts` | CLI entrypoint; hardcoded constants (input filename, email-sent-at `2026-04-09T20:14:00-07:00`, `IMPORT_BATCH_ID = '2026-04-09-backfill'`, `INSTRUCTOR_DISPLAY_NAMES = ['Danny Bauman', 'Dan Hahn']`). No channel or bot-name constants here directly; those live in the writer. |
| `bmad/app/scripts/ingest/writer/write-entries.ts` | **MODIFY**. Line 33: `.in('name', ['general', 'resources'])` → `.in('name', ['cohort-2', 'resources'])`. Line 37: `channelByName.get('general')` → `channelByName.get('cohort-2')`. Line 39: error message update. Line 47: `resolver.resolve('Meet Archive')` → `resolver.resolve('Class Archive')`. Rename the local variable `generalChannelId` → `archiveChannelId` throughout (lines 37, 38, 39, 52, 97). |
| `bmad/app/scripts/ingest/writer/session-roots.ts` | **MODIFY**. Line 7: `generalChannelId: string` → `archiveChannelId: string`. Line 48: `` `📅 Meet chat — ${pretty} session` `` → `` `📅 Class session — ${pretty}` ``. Line 53: `config.generalChannelId` → `config.archiveChannelId`. Line 70: `original_author_raw: 'Meet Archive'` → `original_author_raw: 'Class Archive'`. |
| `bmad/app/scripts/ingest/writer/ghost-users.ts` | **REFERENCE ONLY** (no modification needed). The `ensureMembership` helper already reads channel ids via `loadChannelIds()` which looks up `['general', 'resources']` — we do NOT need to change this because the resolver's channel membership is separate from the session-root target. Ghost users should still be joined to `#general`/`#resources` via that helper if they're being created through the normal ingest flow. But since the SQL migration doesn't go through the writer, the ghost users' existing membership in `#general` is already set from the original ingest run and is fine to leave. For the NEW `#cohort-2` membership (bot + attendees), we'll add via SQL upsert directly. |
| `bmad/app/src/features/channels/ThreadPanel.tsx` | **MODIFY**. Lines 61-63 (`useEffect` with `scrollIntoView`): replace with viewport-scoped scroll. Lines 106-108 (loading state): replace with shadcn `Skeleton` component (2-3 placeholder rows matching `ThreadMessage` layout). |
| `bmad/app/src/features/channels/ChatView.tsx` | **MODIFY**. Lines 339-341: apply the same scroll-fix treatment for consistency (use viewport-scoped scroll instead of default `scrollIntoView`). |
| `bmad/app/src/components/ui/scroll-area.tsx` | **REFERENCE ONLY**. Confirms BaseUI implementation. The wrapper exports `ScrollArea` (Root) and `ScrollBar`. No changes needed here. |
| `bmad/app/src/components/ui/skeleton.tsx` | **CREATE**. Via `npx shadcn@latest add skeleton` from `bmad/app/`. The shadcn-generated file should be a simple `<div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />` pattern. |
| `bmad/app/src/components/shared/AppLayout.tsx` | **REFERENCE ONLY**. Confirms the `<main className="flex-1 overflow-hidden">` wrapper — important context for why the scroll bug is contained within the main area and doesn't blow out the whole page. |
| `bmad/app/src/hooks/useMessages.ts` | **REFERENCE ONLY**. Contains realtime subscription logic (lines 55-77, 100-117) that invalidates on thread-reply changes. Understanding this helps verify the scroll bug is not caused by realtime churn. |
| `bmad/app/supabase/migrations/00012_create_message_imports.sql` | **REFERENCE ONLY**. Used to write the correct SELECTs during SQL migration (filtering by `import_batch_id = '2026-04-09-backfill'`). |
| `devlog/bmad-010-meet-chat-backfill.md` | Prior devlog. Append a short "Follow-up fixes" section after merge to record the cohort-2 / renaming / scroll / skeleton work. |

### Technical Decisions

- **SQL migration vs rollback + re-ingest.** Use SQL migration. It's a narrow, auditable touch on exactly the rows we want, and it doesn't risk any fingerprint drift. A re-ingest would require a rollback first (DELETEs) and exercises the full pipeline, which is heavier and doesn't add real value for a one-time fix. If a future session changes what data looks like, we'll re-run the ingest at that point.
- **Fingerprint source tag unchanged.** `source_fingerprint` in `message_imports` is `sha256(source | session_date | author_raw | timestamp_raw | sha256(content))`. If we change `source` from `'google-meet-email'` to `'class-chat-email'`, every existing provenance row becomes orphaned from its ingest identity, and re-runs would re-insert everything. Since `source` is an internal identifier (not user-visible), we leave it alone.
- **Skeleton loader design.** 3 skeleton placeholders for replies, each row matching the existing `ThreadMessage` layout: `flex gap-3 px-4 py-2` container with a circular `Skeleton` avatar (`h-7 w-7 rounded-full`) + two stacked text `Skeleton` lines (one short for the author row, one fuller for the content). The parent message above the loading area is already rendered from props, so users immediately see the context of what they clicked.
- **Scroll fix approach.** Prefer a direct **viewport ref** over `scrollIntoView`. Plan: introduce a `viewportRef: React.RefObject<HTMLDivElement>` passed to `<ScrollAreaPrimitive.Viewport ref={viewportRef}>` — BUT because the current `ScrollArea` wrapper doesn't expose the Viewport for external refs, we have two choices:
    - **Option A (lighter touch):** Keep the existing `scrollIntoView` but pass `{ block: 'nearest', inline: 'nearest', behavior: 'smooth' }`. `block: 'nearest'` means "scroll the minimum distance needed to make the element visible," which avoids the "scroll this element to the top of the nearest scrollable ancestor" behavior that's causing the escape. This is a 1-line change.
    - **Option B (stronger):** Extend the ScrollArea wrapper to accept a `viewportRef` prop and forward it to the Viewport element. Then in ChatView/ThreadPanel, use `viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })`. More code but precise and future-proof.
    - **Decision: Option A first, then Option B only if Option A doesn't resolve the scroll bug during verification.** Option A is a minimal-risk change with high likelihood of fixing the observed behavior. If the bug persists after Option A, escalate to Option B.
- **Where to re-verify the ingest code change.** **Don't re-run the ingest in prod**. The SQL migration handles the existing data; the code update is only for NEXT ingest. Verify via `npm run ingest:meet-chat:dry-run` locally to confirm the dry-run output reflects the new channel (`cohort-2`) and naming. For a stricter check, `npx supabase db reset` locally, then run the full ingest, and SQL-query the local Supabase for channel distribution.
- **Cohort split decision** (confirmed with Danny): all 7 sessions (Mar 24 → Apr 9) → `#cohort-2`. No session goes to `#pilot-cohort` or anywhere else.
- **Ensuring `cohort-2` bot membership via SQL**. The `ensureMembership` pattern in `writer/ghost-users.ts` runs through the writer only during a fresh ingest. Since we're doing a SQL-only migration, we need to explicitly `INSERT INTO channel_members (channel_id, user_id) VALUES ((SELECT id FROM channels WHERE name = 'cohort-2'), <class_archive_bot_id>) ON CONFLICT DO NOTHING;` for the bot user. We should also make sure the 5 imported ghost users are members of `#cohort-2` (they're probably already members of `#general`, which is where they were initially placed). Danny is already a real account with existing memberships — no action needed for him.
- **Variable rename scope.** The rename `generalChannelId` → `archiveChannelId` touches 2 files (`write-entries.ts`, `session-roots.ts`) — low risk, straightforward find/replace with careful review.

---

## Implementation Plan

### Tasks

Do tasks in this order. Code changes first (can be verified locally), then prod SQL migration (higher risk, done after code is ready), then PR + devlog.

- [ ] **Task 1: Rename hardcoded bot / content / channel constants in ingest writer**
  - Files:
    - `bmad/app/scripts/ingest/writer/write-entries.ts`
    - `bmad/app/scripts/ingest/writer/session-roots.ts`
  - Action in `write-entries.ts`:
    - Line 33: change `.in('name', ['general', 'resources'])` → `.in('name', ['cohort-2', 'resources'])`
    - Line 37: rename local `generalChannelId` → `archiveChannelId`; change `channelByName.get('general')` → `channelByName.get('cohort-2')`
    - Line 39 error message: change `'Seed channels #general and #resources must exist'` → `'Channels #cohort-2 and #resources must exist'`
    - Line 47: change `resolver.resolve('Meet Archive')` → `resolver.resolve('Class Archive')`
    - Lines 52, 97: replace `generalChannelId` references with `archiveChannelId`
    - Comment on line 10 ("Resolve channel ids for #general and #resources.") → update to reflect new channel names
  - Action in `session-roots.ts`:
    - Line 7: in `SessionRootsConfig`, rename field `generalChannelId: string` → `archiveChannelId: string`
    - Line 48: change content template from `` `📅 Meet chat — ${pretty} session` `` → `` `📅 Class session — ${pretty}` ``
    - Line 53: change `config.generalChannelId` → `config.archiveChannelId`
    - Line 70: change `original_author_raw: 'Meet Archive'` → `original_author_raw: 'Class Archive'`
  - Notes: the rename is purely internal/runtime. Session-root fingerprints are `sha256('session-root|' + session_date)`, which does NOT include the author_raw, so renaming the bot is safe for re-run idempotency. Normal message fingerprints use the parser's author_raw (per attendee), which is unchanged.
  - Verify: `cd bmad/app && npx tsc -p tsconfig.node.json --noEmit` passes with no errors, `npm run test` stays green (29/29), `npm run build` stays clean.

- [ ] **Task 2: Install shadcn Skeleton component**
  - Files: creates `bmad/app/src/components/ui/skeleton.tsx`
  - Action: from `bmad/app/`, run `npx shadcn@latest add skeleton` (NOT `shadcn-ui` — that's the deprecated package; this project uses `shadcn@4.1.0`)
  - Verify: file exists at `bmad/app/src/components/ui/skeleton.tsx`, exports `Skeleton`, uses the project's `cn` utility from `@/lib/utils`. Should be ~10 lines.
  - If the CLI prompts interactively, accept defaults. If the file already exists, verify its exports are `Skeleton` and `className`-accepting, then skip the install.

- [ ] **Task 3: Replace ThreadPanel loading state with Skeleton rows**
  - File: `bmad/app/src/features/channels/ThreadPanel.tsx`
  - Action:
    - Add import at top: `import { Skeleton } from '@/components/ui/skeleton'`
    - Add a `ThreadReplySkeleton` helper component inside this file, above `ThreadPanel`, with this exact implementation:

      ```tsx
      function ThreadReplySkeleton() {
        return (
          <div aria-label="Loading replies" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3 px-4 py-2">
                <Skeleton className="h-7 w-7 flex-shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className={`h-3 ${i === 1 ? 'w-5/6' : i === 2 ? 'w-3/4' : 'w-4/5'}`} />
                </div>
              </div>
            ))}
          </div>
        )
      }
      ```

    - Replace line 106-108 (current `{isLoading && <p>...Loading replies...</p>}`) with `{isLoading && <ThreadReplySkeleton />}`. Leave the `replies?.length === 0` branch unchanged.
  - Notes: keep the existing empty-state branch. Skeleton only shows while `isLoading` is true. The `aria-busy` attribute signals loading to assistive tech.
  - Verify: manual — open the app locally, click a reply count, confirm the skeleton flashes briefly before replies render.

- [ ] **Task 4: Fix scroll regression (Option A — `block: 'nearest'`)**
  - Files:
    - `bmad/app/src/features/channels/ThreadPanel.tsx`
    - `bmad/app/src/features/channels/ChatView.tsx`
  - Action in `ThreadPanel.tsx`, lines 61-63:
    ```tsx
    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }, [replies?.length])
    ```
  - Action in `ChatView.tsx`, lines 339-341:
    ```tsx
    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }, [messages?.length])
    ```
  - Notes: `block: 'nearest'` tells the browser "scroll the minimum distance to make the element visible in the nearest scrollable ancestor." This prevents traversal outward and keeps scrolling scoped to the appropriate ScrollArea Viewport. Main body stays untouched.
  - Verify: manual — open a channel with long history, click a reply count, then scroll upward in the main chat area. Main area should accept upward scroll without being pinned to bottom. If the bug persists after this change, proceed to Task 5.

- [ ] **Task 5: Fallback — extend ScrollArea with viewportRef prop (ONLY if Task 4 verification fails)**
  - Files:
    - `bmad/app/src/components/ui/scroll-area.tsx`
    - `bmad/app/src/features/channels/ThreadPanel.tsx`
    - `bmad/app/src/features/channels/ChatView.tsx`
  - Action in `scroll-area.tsx`: accept a new `viewportRef` prop and forward it to `ScrollAreaPrimitive.Viewport`:
    ```tsx
    import type { RefObject } from 'react'
    import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
    import { cn } from "@/lib/utils"

    function ScrollArea({
      className,
      children,
      viewportRef,
      ...props
    }: ScrollAreaPrimitive.Root.Props & { viewportRef?: RefObject<HTMLDivElement | null> }) {
      return (
        <ScrollAreaPrimitive.Root
          data-slot="scroll-area"
          className={cn("relative", className)}
          {...props}
        >
          <ScrollAreaPrimitive.Viewport
            ref={viewportRef}
            data-slot="scroll-area-viewport"
            className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
          >
            {children}
          </ScrollAreaPrimitive.Viewport>
          <ScrollBar />
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      )
    }
    ```
    Keep `ScrollBar` unchanged. If `ScrollAreaPrimitive.Viewport` does not accept a ref directly (check via the `@base-ui/react` types), wrap the Viewport in a `forwardRef` or use a callback ref.
  - Action in `ThreadPanel.tsx`: add `const viewportRef = useRef<HTMLDivElement>(null)`, pass it as `<ScrollArea className="flex-1" viewportRef={viewportRef}>`, and replace the `scrollIntoView` useEffect with:
    ```tsx
    useEffect(() => {
      const vp = viewportRef.current
      if (!vp) return
      vp.scrollTo({ top: vp.scrollHeight, behavior: 'smooth' })
    }, [replies?.length])
    ```
    Remove the `bottomRef` declaration and the trailing `<div ref={bottomRef} />`.
  - Action in `ChatView.tsx`: same pattern — add `viewportRef`, pass it, replace the useEffect, remove `bottomRef`.
  - Verify: same manual test as Task 4.

- [ ] **Task 6: Prod data migration — SQL UPDATE via Management API**
  - Files: none modified in the repo. Executes SQL against prod.
  - Action: run the following sequence from the repo root.

    **Step 6.1 — Resolve PAT from keychain:**
    ```bash
    PAT_RAW=$(security find-generic-password -s "Supabase CLI" -a "supabase" -w)
    PAT=$(echo "${PAT_RAW#go-keyring-base64:}" | base64 -d)
    PROJECT_REF=gwcuxnlhgquchuimuxrk
    ```

    **Step 6.2 — Preview: count the rows that WILL be touched:**
    ```bash
    curl -sS -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
      -H "Authorization: Bearer $PAT" \
      -H "Content-Type: application/json" \
      -d '{"query": "SELECT (SELECT COUNT(*) FROM messages WHERE id IN (SELECT message_id FROM message_imports WHERE import_batch_id = '"'"'2026-04-09-backfill'"'"' AND message_id IS NOT NULL)) AS messages_to_move, (SELECT COUNT(*) FROM messages m JOIN message_imports mi ON mi.message_id = m.id WHERE mi.import_batch_id = '"'"'2026-04-09-backfill'"'"' AND mi.source = '"'"'google-meet-email-root'"'"') AS roots_to_rename, (SELECT display_name FROM profiles WHERE display_name = '"'"'Meet Archive (imported)'"'"') AS bot_current_name"}'
    ```
    Expected: `[{"messages_to_move":48, "roots_to_rename":6, "bot_current_name":"Meet Archive (imported)"}]`. If the counts don't match, STOP and investigate before proceeding to 6.3.

    **Step 6.3 — Perform the migration:**
    ```bash
    curl -sS -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
      -H "Authorization: Bearer $PAT" \
      -H "Content-Type: application/json" \
      -d '{"query": "UPDATE messages SET channel_id = (SELECT id FROM channels WHERE name = '"'"'cohort-2'"'"') WHERE id IN (SELECT message_id FROM message_imports WHERE import_batch_id = '"'"'2026-04-09-backfill'"'"' AND message_id IS NOT NULL); UPDATE messages SET content = REPLACE(REPLACE(content, '"'"'Meet chat'"'"', '"'"'Class session'"'"'), '"'"' session'"'"', '"'"''"'"') WHERE id IN (SELECT message_id FROM message_imports WHERE import_batch_id = '"'"'2026-04-09-backfill'"'"' AND source = '"'"'google-meet-email-root'"'"'); UPDATE profiles SET display_name = '"'"'Class Archive (imported)'"'"' WHERE display_name = '"'"'Meet Archive (imported)'"'"'; INSERT INTO channel_members (channel_id, user_id) SELECT (SELECT id FROM channels WHERE name = '"'"'cohort-2'"'"'), p.id FROM profiles p WHERE p.display_name LIKE '"'"'%(imported)'"'"' OR p.display_name = '"'"'Class Archive (imported)'"'"' ON CONFLICT (channel_id, user_id) DO NOTHING"}'
    ```
    Expected output: `[]` (all statements executed successfully).

    **Step 6.4 — Verify post-migration:**
    ```bash
    curl -sS -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
      -H "Authorization: Bearer $PAT" \
      -H "Content-Type: application/json" \
      -d '{"query": "SELECT c.name AS channel, COUNT(*) AS message_count FROM messages m JOIN channels c ON c.id = m.channel_id JOIN message_imports mi ON mi.message_id = m.id WHERE mi.import_batch_id = '"'"'2026-04-09-backfill'"'"' GROUP BY c.name ORDER BY c.name"}'
    ```
    Expected: `[{"channel":"cohort-2", "message_count":48}]`.

    ```bash
    curl -sS -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
      -H "Authorization: Bearer $PAT" \
      -H "Content-Type: application/json" \
      -d '{"query": "SELECT content FROM messages WHERE id IN (SELECT message_id FROM message_imports WHERE source = '"'"'google-meet-email-root'"'"') ORDER BY created_at"}'
    ```
    Expected: 6 rows. Each content starts with `📅 Class session — ` followed by a date. No row contains `Meet chat` or ends with ` session`.

    ```bash
    curl -sS -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
      -H "Authorization: Bearer $PAT" \
      -H "Content-Type: application/json" \
      -d '{"query": "SELECT display_name, role FROM profiles WHERE display_name LIKE '"'"'%(imported)'"'"' ORDER BY display_name"}'
    ```
    Expected: includes `Class Archive (imported)`, does NOT include `Meet Archive (imported)`.

  - Notes: the migration is re-run safe. The REPLACE statements match no rows on a second run (already renamed), and the channel_id UPDATE also no-ops. Safe to re-run if verification reveals only part of it succeeded.
  - Rollback SQL (in case of disaster):
    ```sql
    UPDATE messages SET channel_id = (SELECT id FROM channels WHERE name = 'general')
      WHERE id IN (SELECT message_id FROM message_imports WHERE import_batch_id = '2026-04-09-backfill' AND message_id IS NOT NULL);
    UPDATE profiles SET display_name = 'Meet Archive (imported)' WHERE display_name = 'Class Archive (imported)';
    UPDATE messages SET content = REPLACE(content, 'Class session —', 'Meet chat —') || ' session'
      WHERE id IN (SELECT message_id FROM message_imports WHERE source = 'google-meet-email-root');
    ```

- [ ] **Task 7: Visual + functional verification on prod**
  - Files: none.
  - Action: open https://magic-brooms.vercel.app, log in as Danny (instructor). Confirm:
    1. `#general` no longer has the 6 session roots and 42 imported replies (only normal cross-cohort chat remains)
    2. `#cohort-2` now has 6 session root messages authored by `Class Archive (imported)`, each reading `📅 Class session — Mon D, YYYY`
    3. Click a session root → thread sidebar opens. Verify the skeleton loader flashes briefly, then the replies render under each root
    4. Scroll upward in the main `#cohort-2` chat body while the thread sidebar is open → should scroll freely (no pinning)
    5. Check `#resources` — 16 gallery cards should still be there, unchanged
  - Notes: Prod deployment has old code (with "Meet" constants in the writer), but since the SQL migration already fixed the data, and we're not re-running the ingest, prod will show the correct data. The code constants will be right after Task 8's merge.

- [ ] **Task 8: Commit + PR + merge**
  - Files: none.
  - Action: from `/Users/Danny/Source/magic-broom-chat`:
    ```bash
    git checkout -b fix/cohort-archive-rename
    git add bmad/app/scripts/ingest/writer/write-entries.ts \
            bmad/app/scripts/ingest/writer/session-roots.ts \
            bmad/app/src/features/channels/ThreadPanel.tsx \
            bmad/app/src/features/channels/ChatView.tsx \
            bmad/app/src/components/ui/skeleton.tsx
    # If Task 5 was needed:
    # git add bmad/app/src/components/ui/scroll-area.tsx
    git commit -m "fix(bmad): rename cohort archive, skeleton loader, scroll fix"
    git push -u origin fix/cohort-archive-rename
    ```
    Then create the PR via `gh pr create` (body should summarize the 4 changes + reference bmad-010 devlog + note that the SQL migration was applied out-of-band). Merge with `gh pr merge <num> --admin --merge --delete-branch`.

- [ ] **Task 9: Append follow-up section to devlog**
  - File: `devlog/bmad-010-meet-chat-backfill.md`
  - Action: append a new `## Follow-up fixes (2026-04-09)` section at the bottom listing: channel rerouted to `#cohort-2`, naming changed (`Meet` → `Class`), skeleton loader added, scroll bug fixed. Reference the new PR number.
  - Notes: doc-only, no code impact. Commit separately OR include in Task 8's branch.

### Acceptance Criteria

- [ ] **AC 1 (Channel routing — data):** Given the prod Supabase state at commit `1f68496`, when the SQL migration in Task 6 runs successfully, then a query `SELECT c.name, COUNT(*) FROM messages m JOIN channels c ON c.id = m.channel_id JOIN message_imports mi ON mi.message_id = m.id WHERE mi.import_batch_id = '2026-04-09-backfill' GROUP BY c.name` returns exactly one row: `(cohort-2, 48)`.

- [ ] **AC 2 (Naming — data):** Given the SQL migration has run, when querying `SELECT content FROM messages WHERE id IN (SELECT message_id FROM message_imports WHERE source = 'google-meet-email-root')`, then all 6 returned rows have content starting with `📅 Class session — ` and no row contains the substring `Meet chat` or ends with ` session` (extra trailing suffix).

- [ ] **AC 3 (Bot rename — data):** Given the SQL migration has run, when querying `SELECT display_name FROM profiles WHERE display_name LIKE 'Class Archive%' OR display_name LIKE 'Meet Archive%'`, then exactly one row returns with `display_name = 'Class Archive (imported)'`.

- [ ] **AC 4 (Cohort-2 membership — data):** Given the SQL migration has run, when querying `SELECT COUNT(*) FROM channel_members cm JOIN profiles p ON p.id = cm.user_id JOIN channels c ON c.id = cm.channel_id WHERE c.name = 'cohort-2' AND p.display_name LIKE '%(imported)'`, then the count is ≥ 6 (5 ghost users + 1 bot; Danny/Dan/Damon are real accounts whose memberships aren't touched).

- [ ] **AC 5 (Ingest script — code compiles and tests pass):** Given the file changes in Task 1, when running `npx tsc -p tsconfig.node.json --noEmit` from `bmad/app/`, then the type-check passes with zero errors. When running `npm run test`, then 29/29 vitest tests pass. When running `npm run build`, then the vite build succeeds.

- [ ] **AC 6 (Ingest script — new constants work end-to-end):** Given the file changes in Task 1, when resetting local Supabase (`npx supabase db reset`) and running `npm run ingest:meet-chat` from `bmad/app/`, then: session root messages are inserted into `#cohort-2` (not `#general`), each with content prefixed `📅 Class session — ` (no trailing ` session`), and the bot profile has `display_name = 'Class Archive (imported)'`.

- [ ] **AC 7 (Skeleton loader — UI):** Given the app is running locally with data, when the user clicks a reply count button to open ThreadPanel AND the `useThreadMessages` query is still pending, then the ThreadPanel body shows 3 skeleton placeholder rows (circular avatar + 2 text lines each) instead of the text "Loading replies..." AND the container has `aria-busy="true"`. When the query resolves, the skeleton is replaced with the actual thread replies.

- [ ] **AC 8 (Scroll fix — UI):** Given the app is running with a channel that has ≥ 20 messages, when the user (a) opens a thread from a message near the top of the channel AND (b) attempts to scroll upward in the main channel area while the ThreadPanel is open, then the main area scrolls freely and the viewport does NOT jump back to the bottom. The scroll position in the main area is preserved across ThreadPanel open/close cycles.

- [ ] **AC 9 (Regression guard — auto-scroll-on-new-message still works):** Given the scroll-fix changes in Task 4 (or fallback Task 5), when a new top-level message arrives via realtime in a channel the user is viewing AND the user is already scrolled near the bottom, then the viewport still auto-scrolls to show the new message. (`block: 'nearest'` scrolls the minimum distance; when the user is already at the bottom, the minimum distance includes the new message.)

- [ ] **AC 10 (Visual prod verification):** Given Tasks 1-7 are complete, when Danny logs into https://magic-brooms.vercel.app as an instructor AND navigates to `#cohort-2`, then the 6 session root messages are visible under `Class Archive (imported)` AND clicking each root shows the threaded replies AND the skeleton loader briefly flashes AND scrolling upward in the main `#cohort-2` body while the sidebar is open works correctly.

## Additional Context

### Dependencies

- **shadcn Skeleton component** — installed in Task 2 via `npx shadcn@latest add skeleton`. No separate package install beyond what the shadcn CLI handles.
- **No new runtime dependencies.** Existing stack (React, TanStack Query, BaseUI, Supabase JS client) covers everything.
- **Supabase PAT** (for Management API SQL execution in Task 6) — already in macOS Keychain under service `Supabase CLI`, account `supabase`.
- **Prerequisite state**: Tasks 1-5 should be locally green (build + tests pass) before Task 6 runs against prod, so rollback via git is straightforward if anything goes wrong. Code changes are version-controlled; prod data is not.
- **No task depends on re-running the ingest against prod.** The SQL migration in Task 6 handles existing rows directly. The script constant changes in Task 1 are for future runs only.

### Testing Strategy

**Automated (local, fast):**

- `cd bmad/app && npx tsc -p tsconfig.node.json --noEmit` — script type-check (catches any typo in Task 1's field rename)
- `cd bmad/app && npm run test` — vitest (29 tests; should remain green — none of the script changes touch fingerprint logic, the only thing with tests)
- `cd bmad/app && npm run build` — vite production build (catches ThreadPanel/ChatView type errors and any Skeleton import issues)

**Manual (visual + behavioral):**

1. **Local ingest dry-run + live** (highest-confidence check of the Task 1 code changes):
   - `npx supabase stop && npx supabase start && npx supabase db reset`
   - Add `SUPABASE_SERVICE_ROLE_KEY` from `npx supabase status` to `bmad/app/.env.local`
   - `npm run ingest:meet-chat:dry-run` — eyeball: entries look right, no `Meet` anywhere in the output
   - `npm run ingest:meet-chat` — should create session roots in `#cohort-2` with `📅 Class session —` prefix, bot profile named `Class Archive (imported)`
   - `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT c.name, COUNT(*) FROM messages m JOIN channels c ON c.id = m.channel_id JOIN message_imports mi ON mi.message_id = m.id WHERE mi.import_batch_id = '2026-04-09-backfill' GROUP BY c.name"` — expect `cohort-2, 48`
   - Revert `.env.local` after (remove the service_role key)

2. **Local dev server UI check** (ThreadPanel skeleton + scroll fix):
   - `npm run dev` from `bmad/app/`
   - Log in as any user
   - Open a channel with ≥ 20 messages AND at least one message with replies
   - Click the reply count → observe: skeleton flashes briefly before thread contents appear
   - While sidebar is open, scroll up in main area → should scroll freely
   - Close sidebar with X button → main area scroll position preserved
   - Keyboard test: ESC key closes the thread panel (existing behavior, should still work)

3. **Prod smoke test** (after Task 6 SQL migration + Task 8 PR merge):
   - Open https://magic-brooms.vercel.app as Danny
   - Navigate to `#cohort-2` → scroll to find the Mar 24, 2026 root → click it → thread opens with skeleton flash, then ~12 replies load
   - Scroll up in the main `#cohort-2` body while the sidebar is open → should work
   - Check `#resources` — 16 gallery cards should still be there (sanity)
   - Check `#general` — no imported content visible

### Notes

**Risks:**

- **SQL migration double-apply.** If Task 6.3 runs twice, the REPLACE statements on root content idempotently leave content alone (no double-rename), the bot rename update safely does nothing (0 rows affected), the channel_id update no-ops (target already cohort-2), and the channel_members insert is upsert-safe. Low risk.

- **Scroll fix (Option A) not resolving the bug.** Option A is based on reading code without reproducing the bug locally. If `{ block: 'nearest' }` doesn't solve it, Option B (viewport ref) is the fallback. Option B is more code but more deterministic. Cost of fallback: one extra task (Task 5).

- **shadcn CLI prompting interactively.** If `npx shadcn@latest add skeleton` prompts for config, accept defaults. The project already has `bmad/app/components.json`, so the CLI should auto-resolve. If the prompt asks about overwriting an existing file, that's a signal something is already there — inspect before saying yes.

- **Fingerprint re-runs.** Session-root fingerprints are `sha256('session-root|' + session_date)` — do NOT include `author_raw`, so renaming the bot is safe. Normal message fingerprints use the parser's per-attendee `author_raw` (unchanged). Conclusion: re-runs of the ingest script with the new constants remain idempotent against prior data. Confirmed safe.

- **Prod deployment cadence.** Vercel auto-deploys from `main`. The Task 8 PR merge triggers a ~60-second deploy. No user-visible effect beyond what the SQL migration already did, because the only runtime difference is the ingest script's target channel — and ingest is a manual operation.

**Known limitations (intentionally out of scope):**

- The scroll fix is scoped to the `scrollIntoView` call. Other scroll-related bugs in the same files are not touched.
- Channel routing in the ingest script is now hardcoded to `cohort-2`. If a future ingest needs per-session channel routing (e.g., split across cohorts), that's a future change.
- The parser edge case from the original ingest (Kimi/GLM/Gemini single-entry multi-URL → one message instead of 3 cards) remains unfixed. Still out of scope.
- The `supabase_migrations.schema_migrations` tracking table on prod is still missing rows for 00010/00011/00012 (noted in the original bmad-010 devlog). This fix doesn't touch that.

**Future considerations:**

- Automated visual regression test for thread panel skeleton + scroll behavior using Playwright or similar.
- Parameterize the ingest script's session_date → channel map for future multi-cohort sources.
- Extend the ScrollArea wrapper with `viewportRef` (Option B) proactively as a forward-looking investment, even if Option A solves the current bug.

**Operational:**

- Prod project ref: `gwcuxnlhgquchuimuxrk` (magic-broom-bmad).
- Prod `.env.local` has only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; the service_role key was removed after the initial ingest and should NOT be re-added permanently. For Task 6, the PAT (already in Keychain) is sufficient via Management API.
- Local Supabase instance at `bmad/app/supabase/` uses Docker; both must be running for the local manual tests (Testing Strategy #1 and #2).
