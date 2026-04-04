# bmad-010: Midnight Workshop Redesign

**Date:** 2026-04-04
**Branch:** design-variant-gstack

## What was completed

Full visual redesign of the Magic Brooms chat app with a "Midnight Workshop" aesthetic direction. This is one of 5 parallel design variants being compared.

### Design direction
- **Dark-first**: Warm midnight backgrounds (oklch 0.12 at hue 270) as the default, no light mode toggle needed
- **Warm amber/gold accent**: Primary color shifted from cold indigo to warm amber (oklch 0.72 at hue 55) for all interactive elements
- **Serif display headings**: Added Source Serif 4 Variable for headings, creating typographic contrast against Geist body text
- **Atmospheric auth pages**: Radial gradient backgrounds with subtle amber glow, glass-morphism card effect (backdrop-blur + opacity)
- **Glow effects**: Subtle ambient glow on cards, inputs on focus, and gallery card hover states

### Files changed (12)
- `index.css` — Complete color palette rework, new CSS utility classes (auth-bg, card-glow, input-glow, date-separator)
- `LoginPage.tsx`, `SignupPage.tsx`, `ForgotPasswordPage.tsx` — Removed Card/shadcn wrapper, custom atmospheric cards with serif headings
- `AppLayout.tsx` — Refined sidebar with sparkle icon, warm accent highlights, better mobile header with avatar circle
- `ChatView.tsx` — Custom date separators with amber accent, warmer hover states, integrated input-glow on message composer
- `GalleryView.tsx`, `GalleryCardDetail.tsx` — Card hover glow effects, serif headings, refined spacing
- `ProfilePage.tsx` — Avatar ring glow, label refinements

## Key decisions
- Went dark-only (no light mode) since the "workshop at midnight" concept is fundamentally a dark theme
- Used `color-scheme: dark` on html element for correct browser chrome
- Kept Geist Variable for body text (it's a good font), added Source Serif 4 only for headings
- Removed Separator component from sidebar in favor of simpler div-based lines for visual lightness
- Used oklch throughout for perceptually uniform color manipulation

## What's next
- Compare with other 4 design variants
- May need to add prefers-reduced-motion support for glow animations
- Gallery card images could benefit from a subtle vignette overlay
