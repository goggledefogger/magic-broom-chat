# bmad-010: Ember & Ink UI Redesign

**Date:** 2026-04-04
**Branch:** `design-variant-bmad`

## What Was Completed

Full visual redesign of the Magic Brooms chat app using the "Ember & Ink" design system. This is one of 5 parallel design variants being compared.

### Design Direction
Dark mode with warm undertones — ink-black backgrounds (#111827), parchment-warm text (#f0e6d8), and ember-orange (#f15a24) accents. Aligned with A Portland Career's brand palette.

### Changes Made
- **Color system:** Replaced Sorcerer's Apprentice oklch theme with hex-based Ember & Ink theme using APC brand colors (#f15a24 orange, #54548E purple, #2DA3CB blue)
- **Typography:** Added Merriweather serif for headings alongside existing Geist Variable sans-serif
- **Sidebar:** Gradient divider under logo, active channel left-border (APC orange), avatar initials in user footer
- **Chat:** Orange author names, own-message background tint, gradient date separators, serif channel headers
- **Auth pages:** Orange accent top border on cards, serif titles, blue footer links
- **Gallery:** Serif card titles, warm hover lift effect, accent-colored external links
- **Profile:** Role badge pill, serif heading, accent links

### Files Modified (12)
- `index.css` (full rewrite)
- `App.tsx`, `AppLayout.tsx`
- `LoginPage.tsx`, `SignupPage.tsx`, `ForgotPasswordPage.tsx`
- `ChatView.tsx`, `ChannelPage.tsx` (unchanged)
- `GalleryView.tsx`, `GalleryCardDetail.tsx`
- `ProfilePage.tsx`
- `package.json` (added @fontsource/merriweather)

## Key Decisions

- **Hex over oklch:** Simpler, more predictable, easier for students to read
- **Single dark theme:** No light/dark toggle — the warm-dark aesthetic IS the brand
- **No glassmorphism/blur:** Performance concern on mobile; warmth of palette is distinctive enough
- **Merriweather for headings only:** Body text stays Geist Variable for readability at small sizes
- **APC left-border pattern:** Adapted for active channel indicator — bridges the brand connection

## Process

Followed the BMAD workflow: brainstorming with visual companion for design direction selection, wrote spec, wrote implementation plan, executed via parallel subagents. Total: 5 commits on branch.

## What's Next

- Compare with other 4 design variants
- Collect feedback on the variant comparison
- Deploy winning variant to production
