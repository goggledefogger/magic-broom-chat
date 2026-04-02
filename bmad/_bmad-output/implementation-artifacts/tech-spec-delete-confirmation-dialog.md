---
title: 'Delete Confirmation Dialog'
slug: 'delete-confirmation-dialog'
created: '2026-04-02'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['react-19', 'typescript', 'tailwind-v4', 'shadcn-ui', 'base-ui-react', 'lucide-react']
files_to_modify: ['bmad/app/src/components/ui/alert-dialog.tsx', 'bmad/app/src/features/channels/ChatView.tsx']
code_patterns: ['Dialog built on @base-ui/react/dialog primitives', 'DialogContent uses fixed positioning with translate centering and sm:max-w-sm', 'DialogFooter uses -mx-4 -mb-4 rounded-b-xl border-t bg-muted/50 pattern', 'Animations via data-open/data-closed with animate-in/out', 'Floating toolbar in MessageItem uses group-hover:opacity-100']
test_patterns: ['manual browser testing via Playwright MCP']
---

# Tech-Spec: Delete Confirmation Dialog

**Created:** 2026-04-02

## Overview

### Problem Statement

Clicking the delete button on a message immediately hard-deletes it with no confirmation. Too easy to accidentally lose content.

### Solution

Add a reusable AlertDialog component (built on the same @base-ui/react/dialog primitives as the existing Dialog) that gates all destructive actions. Wire it to message delete in ChatView. Styled to match the Sorcerer's Apprentice theme with the existing Dialog patterns.

### Scope

**In Scope:**
- Create AlertDialog component matching existing Dialog style
- Wire to message delete in ChatView
- Responsive, theme-consistent
- Reusable for future destructive actions

**Out of Scope:**
- Soft delete / undo
- Confirmation for other entities (component is reusable for future)

## Context for Development

### Codebase Patterns

- Dialog component (`components/ui/dialog.tsx`) is built on `@base-ui/react/dialog` primitives (Root, Trigger, Backdrop, Popup, Close, Title, Description)
- DialogContent uses fixed centering: `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
- Responsive: `max-w-[calc(100%-2rem)]` on mobile, `sm:max-w-sm` on desktop
- Animations: `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95`
- DialogFooter has a distinctive style: `-mx-4 -mb-4 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end`
- Delete button in ChatView (line 218) calls `deleteMessage.mutate()` directly with no gate
- The floating toolbar appears via `group-hover:opacity-100` on the message row

### Files to Reference

| File | Purpose |
| ---- | ------- |
| bmad/app/src/components/ui/dialog.tsx | Existing Dialog to match style/patterns exactly |
| bmad/app/src/features/channels/ChatView.tsx | Message delete button (line 218) to wire up |
| bmad/app/src/components/ui/button.tsx | Button variants (default, outline, destructive) |

### Technical Decisions

- Build AlertDialog from same @base-ui/react/dialog primitives (no new dependency)
- Match Dialog's visual style exactly (same overlay, content, footer patterns)
- Use controlled open state in MessageItem rather than Trigger-based (since delete button is in a hover toolbar)
- Delete button in footer uses `variant="destructive"` for clear visual signal

## Implementation Plan

### Tasks

- [ ] Task 1: Create AlertDialog component
  - File: `bmad/app/src/components/ui/alert-dialog.tsx`
  - Action: Build a reusable AlertDialog with these exports:
    - `AlertDialog` (Root wrapper with controlled open/onOpenChange)
    - `AlertDialogContent` (matches DialogContent style, no close X button)
    - `AlertDialogHeader` (matches DialogHeader)
    - `AlertDialogFooter` (matches DialogFooter)
    - `AlertDialogTitle` (matches DialogTitle)
    - `AlertDialogDescription` (matches DialogDescription)
    - `AlertDialogAction` (Button that fires the confirm action)
    - `AlertDialogCancel` (Button that closes the dialog)
  - Notes: Use the exact same @base-ui/react/dialog primitives. AlertDialog differs from Dialog in that it has no close X, the overlay click doesn't dismiss, and it requires an explicit Cancel/Action choice.

- [ ] Task 2: Wire AlertDialog to message delete
  - File: `bmad/app/src/features/channels/ChatView.tsx`
  - Action:
    1. Add `showDeleteConfirm` state to MessageItem
    2. Change delete button onClick to `setShowDeleteConfirm(true)` instead of immediate mutate
    3. Render AlertDialog with title "Delete message?", description "This can't be undone.", Cancel button and destructive Delete button
    4. Delete button in AlertDialog calls `deleteMessage.mutate()` and closes the dialog
  - Notes: The AlertDialog should render outside the floating toolbar div to avoid z-index/positioning issues.

### Acceptance Criteria

- [ ] AC 1: Given an instructor clicks the delete icon on a message, when the toolbar button is clicked, then a confirmation dialog appears (not an immediate delete)
- [ ] AC 2: Given the confirmation dialog is open, when the user clicks Cancel, then the dialog closes and the message is preserved
- [ ] AC 3: Given the confirmation dialog is open, when the user clicks Delete, then the message is deleted and the dialog closes
- [ ] AC 4: Given the confirmation dialog is open, when the user presses Escape, then the dialog closes without deleting
- [ ] AC 5: Given a mobile viewport, when the confirmation dialog appears, then it is properly sized and readable
- [ ] AC 6: The AlertDialog component is reusable (exported from components/ui/) for future destructive actions

## Additional Context

### Dependencies

No new packages. Uses existing @base-ui/react/dialog primitives.

### Testing Strategy

Manual Playwright MCP browser testing: click delete, verify dialog appears, test Cancel and Delete buttons, test Escape key, check mobile viewport.

### Notes

CLAUDE.md updated with UX convention: "Confirm before delete" for all destructive actions app-wide. Future features should use this AlertDialog component.
