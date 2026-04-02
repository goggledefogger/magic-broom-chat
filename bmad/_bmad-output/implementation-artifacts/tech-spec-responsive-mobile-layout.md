---
title: 'Responsive Mobile Layout'
slug: 'responsive-mobile-layout'
created: '2026-04-02'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['react-19', 'typescript', 'tailwind-v4', 'shadcn-ui', 'base-ui-react']
files_to_modify: ['bmad/app/src/components/shared/AppLayout.tsx', 'bmad/app/src/components/ui/sheet.tsx', 'bmad/app/src/features/channels/ChatView.tsx']
code_patterns: ['AppLayout: flex h-screen with w-64 sidebar + flex-1 main', 'Dialog primitives from @base-ui/react/dialog for overlay components', 'Tailwind breakpoints: sm: md: lg: (gallery already uses them)', 'Floating toolbar: absolute positioned, group-hover:opacity-100', 'GalleryView grid already responsive: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3']
test_patterns: ['manual browser testing via Playwright MCP with viewport resize']
---

# Tech-Spec: Responsive Mobile Layout

**Created:** 2026-04-02

## Overview

### Problem Statement

The app is desktop-only. The sidebar is hardcoded at 256px with no mobile layout. The floating message toolbar requires hover which doesn't exist on touch devices. Students using their phones see a cramped, unusable layout.

### Solution

Two layouts, one component tree. Mobile (<768px): sidebar becomes a slide-out drawer triggered by a hamburger button. Full-screen messages. Desktop (>=768px): current layout unchanged. Long-press for message actions on mobile. Touch-friendly sizing throughout.

### Scope

**In Scope:**
- Sheet/drawer component (built on existing base-ui Dialog primitives)
- Responsive AppLayout: sidebar hidden on mobile, drawer on demand
- Mobile header bar: hamburger (left), channel name (center), user avatar (right)
- Long-press for message action toolbar on mobile (edit/delete)
- Touch-friendly action button sizing (min 44px tap targets)
- Message composer handles mobile keyboard (viewport resize)

**Out of Scope:**
- Bottom tab navigation
- Swipe gestures between channels
- Offline support
- Pull-to-refresh

## Context for Development

### Codebase Patterns

- AppLayout: `flex h-screen` with `w-64` sidebar + `flex-1` main. No responsive classes.
- Dialog/AlertDialog built on `@base-ui/react/dialog` primitives (Backdrop, Popup, Portal). Sheet can follow same pattern.
- GalleryView already responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Floating toolbar: `absolute -top-3 right-4`, `opacity-0 group-hover:opacity-100`
- Tailwind v4 breakpoint: `md:` = 768px (our mobile/desktop split)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| bmad/app/src/components/shared/AppLayout.tsx | Main layout, sidebar + main, needs responsive overhaul |
| bmad/app/src/components/ui/dialog.tsx | Pattern for building Sheet from same primitives |
| bmad/app/src/features/channels/ChatView.tsx | Floating toolbar + composer, needs long-press + touch sizing |
| bmad/app/src/features/gallery/GalleryView.tsx | Already responsive (reference pattern) |

### Technical Decisions

- Use `md:` (768px) as the mobile/desktop breakpoint
- Build Sheet component from @base-ui/react/dialog (slide-in from left, same overlay pattern)
- Use `useMediaQuery` or Tailwind `md:hidden`/`md:block` to toggle sidebar vs drawer
- Long-press via `onTouchStart`/`onTouchEnd` with a 500ms timer
- Mobile header is only rendered below md breakpoint
- Channel selection on mobile closes the drawer and navigates

## Implementation Plan

### Tasks

- [ ] Task 1: Create Sheet component
  - File: `bmad/app/src/components/ui/sheet.tsx`
  - Action: Build a slide-in drawer using @base-ui/react/dialog primitives. Slides from left. Same overlay as Dialog. Includes SheetContent, SheetHeader, SheetTitle, SheetClose. Width: `w-72` (288px, slightly wider than current sidebar for touch friendliness).
  - Notes: Use `translate-x` animation instead of zoom. `data-open:-translate-x-0 data-closed:-translate-x-full`.

- [ ] Task 2: Make AppLayout responsive
  - File: `bmad/app/src/components/shared/AppLayout.tsx`
  - Action:
    1. Add `useSidebarOpen` state for mobile drawer
    2. Desktop (md+): render sidebar as-is with `hidden md:flex` on the aside
    3. Mobile (<md): render sidebar content inside Sheet component
    4. Add mobile header bar: hamburger button (left), current channel name (center), user avatar link (right). Only visible below md.
    5. Channel clicks on mobile: navigate + close drawer via `onOpenChange(false)`
    6. Wrap channel links/buttons in a callback that closes the sheet on mobile
  - Notes: The sidebar content (channels, search, user section) stays identical. Only the container changes between `<aside>` (desktop) and `<Sheet>` (mobile).

- [ ] Task 3: Add long-press for message toolbar on mobile
  - File: `bmad/app/src/features/channels/ChatView.tsx`
  - Action:
    1. Add `useLongPress` hook or inline logic: `onTouchStart` starts a 500ms timer, `onTouchEnd`/`onTouchMove` cancels it. On fire, show the toolbar.
    2. On mobile, toolbar is shown via state (not hover). Clicking outside or selecting an action hides it.
    3. Increase toolbar button tap targets to min 44x44px on mobile (`md:p-1 p-2.5` or similar)
    4. Keep desktop hover behavior unchanged
  - Notes: Use `onPointerDown`/`onPointerUp` instead of separate touch/mouse handlers for unified behavior. Check `pointerType === 'touch'` to differentiate.

- [ ] Task 4: Touch-friendly sizing and composer fixes
  - File: `bmad/app/src/features/channels/ChatView.tsx`
  - Action:
    1. Message composer: ensure it stays visible when mobile keyboard opens. Use `dvh` (dynamic viewport height) on the chat container instead of `h-screen` or `h-full` where needed.
    2. Reaction picker: ensure emoji buttons are touch-friendly (min 44px)
    3. Send button: increase tap target on mobile
  - Notes: Tailwind v4 supports `h-dvh` for dynamic viewport height.

### Acceptance Criteria

- [ ] AC 1: Given a mobile viewport (<768px), when the app loads, then the sidebar is hidden and a header bar with hamburger is shown
- [ ] AC 2: Given mobile, when the user taps the hamburger, then the sidebar slides in as a drawer from the left
- [ ] AC 3: Given the mobile drawer is open, when the user taps a channel, then the drawer closes and the channel loads full-width
- [ ] AC 4: Given mobile, when the user long-presses their own message, then the edit/delete toolbar appears
- [ ] AC 5: Given desktop (>=768px), when the app loads, then the sidebar is always visible (unchanged from current)
- [ ] AC 6: Given mobile, when the message composer is focused, then it remains visible above the keyboard
- [ ] AC 7: Given any viewport, when the gallery view is shown, then the grid adapts (already responsive, verify not broken)
- [ ] AC 8: Given mobile, all interactive elements (buttons, links, toolbar actions) have at least 44px tap targets

## Additional Context

### Dependencies

No new packages. Sheet built from existing @base-ui/react/dialog.

### Testing Strategy

Manual Playwright MCP testing with viewport resize:
1. `$B viewport 375x812` for mobile, `$B viewport 1280x720` for desktop
2. Test drawer open/close, channel navigation, long-press, composer with keyboard

### Notes

- The `h-screen` on the root container may need to become `h-dvh` for proper mobile viewport handling (accounts for browser chrome/address bar).
- Search overlay in AppLayout (`absolute left-0 top-24 z-50 w-64`) will need to work within the Sheet on mobile.
- Auto-join logic and channel badges should work unchanged since they're in hooks, not layout.
