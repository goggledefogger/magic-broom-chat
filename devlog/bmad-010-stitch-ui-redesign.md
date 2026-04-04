# bmad-010: Stitch MCP UI Redesign

**Date:** 2026-04-04
**Branch:** `design-variant-stitch`

## What was completed

Full visual redesign of the Magic Brooms chat app using Google Stitch MCP tools. This is one of 5 parallel design variants being compared.

### Design Direction: "Enchanted Apothecary"
- Shifted from purple/gold to **deep forest green + luminous emerald + warm amber**
- Dark-mode-only design inspired by a botanical workshop aesthetic
- Glassmorphism effects for modals and floating elements
- Tonal surface layering instead of border-based sectioning

### Files Modified
- `index.css` — Complete color system overhaul with Stitch-generated tokens, Google Fonts (Sora + DM Sans), custom utilities (glass-card, btn-emerald, hover-glow, auth-bg)
- `AppLayout.tsx` — Restyled sidebar with amber highlights, emerald active states, ghost borders
- `LoginPage.tsx`, `SignupPage.tsx`, `ForgotPasswordPage.tsx` — Frosted glass cards on radial gradient backgrounds
- `ChatView.tsx` — Message reactions, floating toolbar, input with tonal layering
- `GalleryView.tsx` — Hover glow effect on cards, emerald gradient buttons
- `GalleryCardDetail.tsx` — Updated reactions, comments, and card detail styling
- `ProfilePage.tsx` — Emerald avatar ring, gold role badge, glass card
- `App.tsx` — Updated welcome screen

### Stitch MCP Workflow
1. Created Stitch project (`3880572934412120172`)
2. Created design system with custom emerald/amber palette
3. Generated 4 screens: Login, Chat, Gallery, Profile
4. Extracted design tokens and adapted to existing React + Tailwind v4 + shadcn/ui

## Key Decisions
- Kept fonts loaded via Google Fonts CDN rather than npm packages for simplicity
- Single dark theme (no light mode) — the design is inherently dark
- Used CSS custom properties for all colors to maintain shadcn/ui compatibility
- Ghost borders at 15% opacity instead of visible borders

## What's Next
- Compare with other design variants
- Potential refinements based on feedback
