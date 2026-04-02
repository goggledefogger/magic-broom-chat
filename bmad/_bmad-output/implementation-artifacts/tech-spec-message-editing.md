---
title: 'Message Editing'
slug: 'message-editing'
created: '2026-04-02'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['react-19', 'typescript', 'supabase-js', 'tanstack-query', 'tailwind-v4', 'shadcn-ui']
files_to_modify: ['bmad/app/src/hooks/useMessages.ts', 'bmad/app/src/features/channels/ChatView.tsx']
code_patterns: ['mutations via useMutation + queryClient.invalidateQueries on success', 'hover actions via group/group-hover Tailwind classes with opacity-0 to opacity-100 transition', 'Message interface maps DB snake_case to camelCase via toMessage()', 'Textarea component with Enter to submit and Shift+Enter for newline', 'Realtime subscription uses event: * which already covers UPDATE events']
test_patterns: ['manual browser testing via Playwright MCP']
---

# Tech-Spec: Message Editing

**Created:** 2026-04-02

## Overview

### Problem Statement

Users can't edit their own messages after sending. The messages table has an `updated_at` column but no UPDATE RLS policy, no edit mutation hook, and no edit UI.

### Solution

Add a pencil icon on hover for the user's own messages (matching the existing delete button pattern). Clicking swaps the message content to an inline textarea (like Slack). Enter saves, Escape cancels. Show "(edited)" indicator when updated_at differs from created_at. Add RLS policy restricting UPDATE to the message author only.

### Scope

**In Scope:**
- Edit pencil icon on hover (own messages only), well-positioned and non-interfering
- Inline textarea swap on click (like Slack)
- Save with Enter, cancel with Escape
- "(edited)" indicator next to timestamp
- Supabase UPDATE RLS policy (own messages only)
- useEditMessage mutation hook
- updated_at tracking in Message interface

**Out of Scope:**
- Edit history / audit log
- Instructor edit permissions (future)
- Markdown preview while editing
- Editing gallery card content

## Context for Development

### Codebase Patterns

- `MessageItem` component (ChatView.tsx:91-135) renders each message with avatar, name, timestamp, content, and reactions
- Hover actions use `group` on the message row div and `group-hover:opacity-100` on action buttons (e.g., delete button at line 122-127)
- Delete button is positioned with `ml-auto` in the header flex row, only shown for instructors
- Message interface has: id, channelId, userId, content, createdAt, profile (no updatedAt yet)
- `toMessage()` maps snake_case DB columns to camelCase
- Existing `useDeleteMessage` pattern: mutationFn does the DB call, onSuccess invalidates queries
- The message composer uses Textarea with Enter to submit (Shift+Enter for newline) at line 166-170
- Realtime subscription uses `event: '*'` so UPDATE events are already captured

### Files to Reference

| File | Purpose |
| ---- | ------- |
| bmad/app/src/hooks/useMessages.ts | Message mutations (send, delete), needs edit mutation + updatedAt in interface |
| bmad/app/src/features/channels/ChatView.tsx | MessageItem component with hover actions, needs edit UI |
| bmad/app/supabase/migrations/00003_create_messages.sql | Messages schema, has updated_at, missing UPDATE policy |
| bmad/app/src/components/ui/textarea.tsx | Textarea component used for message input |

### Technical Decisions

- Inline editing (textarea swap) rather than modal
- Enter to save, Escape to cancel (Slack convention)
- RLS enforces author-only editing at database level (only content and updated_at columns)
- Realtime subscription already listens to all events (*) on messages table, so UPDATE events auto-invalidate
- Apply UPDATE RLS policy directly to production via Supabase MCP (also create migration file for source control)
- Position hover actions (edit pencil + delete) in a floating toolbar at top-right of message row to avoid interfering with message content and reactions

## Implementation Plan

### Tasks

- [ ] Task 1: Add UPDATE RLS policy for messages
  - Action: Apply to production via Supabase MCP, then create `bmad/app/supabase/migrations/00010_messages_update_policy.sql`
  - SQL: `CREATE POLICY "messages_update_own" ON messages FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());`
  - Notes: USING clause ensures you can only select your own rows for update. WITH CHECK ensures you can't change user_id to someone else's.

- [ ] Task 2: Add `updatedAt` to Message interface and `useEditMessage` hook
  - File: `bmad/app/src/hooks/useMessages.ts`
  - Action:
    1. Add `updatedAt: string` to the Message interface
    2. Add `updatedAt: row.updated_at as string` to `toMessage()`
    3. Add `useEditMessage()` mutation that updates content + updated_at, following the useDeleteMessage pattern
  - Notes: The mutation should update `content` and set `updated_at` to NOW(). Invalidate `['messages', channelId]` on success.

- [ ] Task 3: Add edit UI to MessageItem
  - File: `bmad/app/src/features/channels/ChatView.tsx`
  - Action:
    1. Add `isEditing` state and `editContent` state to MessageItem
    2. Move hover action buttons (edit + delete) into a floating toolbar div at the top-right corner of the message row (position absolute, appears on group-hover). This keeps them visible and non-interfering.
    3. Add pencil icon button (only for own messages: `message.userId === userId`). Clicking sets `isEditing = true` and `editContent = message.content`.
    4. When `isEditing`: replace the `<p>` content with a `<Textarea>` pre-filled with editContent. Auto-focus the textarea.
    5. Enter saves (call useEditMessage, set isEditing false). Escape cancels (set isEditing false). Shift+Enter for newline.
    6. Show small "Save" / "Cancel" text buttons below the textarea for discoverability.
    7. Add "(edited)" indicator: when `message.updatedAt !== message.createdAt`, show a subtle `(edited)` text next to the timestamp.
  - Notes: The delete button (instructor-only) should also move into the floating toolbar for consistency.

### Acceptance Criteria

- [ ] AC 1: Given a user viewing their own message, when they hover over it, then a pencil edit icon appears (and delete if instructor)
- [ ] AC 2: Given a user viewing another user's message, when they hover, then no edit icon appears
- [ ] AC 3: Given a user clicks the edit icon on their message, when the edit mode activates, then the message content swaps to a pre-filled textarea with focus
- [ ] AC 4: Given a user is editing a message, when they press Enter, then the message is saved with updated content and "(edited)" appears
- [ ] AC 5: Given a user is editing a message, when they press Escape, then editing is cancelled and original content is restored
- [ ] AC 6: Given a user edits a message, when another user views the channel, then they see the updated content in real-time via the existing realtime subscription
- [ ] AC 7: Given a user tries to edit another user's message via API, when the update is attempted, then Supabase RLS rejects it
- [ ] AC 8: Given a message has been edited, when any user views it, then "(edited)" appears next to the timestamp

## Additional Context

### Dependencies

No new packages needed.

### Testing Strategy

Manual Playwright MCP browser testing:
1. Log in, send a message, hover to see edit icon
2. Click edit, modify content, press Enter to save
3. Verify "(edited)" indicator appears
4. Press Escape to cancel an edit, verify original content restored
5. Verify another user's messages don't show the edit icon
6. Verify the RLS policy blocks unauthorized edits

### Notes

- The floating toolbar pattern (top-right of message row) is common in chat UIs (Slack, Discord). It avoids the current issue where the delete button is inline with the author name, which can be hard to see.
- Shift+Enter should insert a newline in the edit textarea, matching the behavior of the message composer.
