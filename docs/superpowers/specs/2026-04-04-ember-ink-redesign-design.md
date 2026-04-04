# Ember & Ink — Magic Brooms UI Redesign Spec

**Date:** 2026-04-04
**Branch:** `design-variant-bmad`
**Scope:** Visual redesign of all UI files in `bmad/app/src/`. No changes to hooks, lib, or stores.

## Design Direction

Dark mode with warm undertones. Ink-black backgrounds, parchment-warm text, ember-orange accents. The aesthetic is "grimoire meets modern chat" — adult, minimalist, mystical without being theatrical. Aligned with A Portland Career's brand palette and typography.

## Brand Alignment

A Portland Career (aportlandcareer.com) uses:
- **Orange** `#f15a24` — primary accent, buttons, borders
- **Purple** `#54548E` — CTAs, headers
- **Blue** `#2DA3CB` — callouts, highlights
- **Merriweather** serif for headings
- **Left-border callouts** as a signature design element

Magic Brooms adopts all of these, reinterpreted for a dark chat UI.

## Color System

All colors defined as CSS custom properties in `index.css`. Using hex values (not OKLch) for simplicity and predictability.

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#111827` | Page background |
| `--foreground` | `#f0e6d8` | Primary text |
| `--card` | `#1a2030` | Card/panel backgrounds |
| `--card-foreground` | `#f0e6d8` | Card text |
| `--sidebar` | `#151c2a` | Sidebar background |
| `--sidebar-foreground` | `#f0e6d8` | Sidebar text |
| `--sidebar-accent` | `rgba(241,90,36,0.08)` | Active channel background |
| `--sidebar-border` | `rgba(240,230,216,0.06)` | Sidebar dividers |
| `--primary` | `#f15a24` | APC orange — CTAs, active states, own-message tint |
| `--primary-foreground` | `#fff` | Text on primary buttons |
| `--secondary` | `#54548E` | APC purple — avatars, badges |
| `--secondary-foreground` | `#f0e6d8` | Text on secondary elements |
| `--accent` | `#2DA3CB` | APC blue — online indicators, info |
| `--accent-foreground` | `#fff` | Text on accent |
| `--muted` | `#222a3a` | Muted backgrounds, hover states |
| `--muted-foreground` | `rgba(240,230,216,0.5)` | Timestamps, secondary text |
| `--border` | `rgba(240,230,216,0.06)` | All borders |
| `--ring` | `rgba(241,90,36,0.4)` | Focus rings |
| `--destructive` | `#e53e3e` | Delete actions |
| `--destructive-foreground` | `#fff` | Text on destructive |

**No light mode.** This is a dark-first design. The existing dark mode toggle can be removed or repurposed later.

## Typography

- **Headings (h1-h3, logo, channel headers):** `'Merriweather', Georgia, serif` — weight 700
- **Body text, UI elements:** `'Geist Variable', system-ui, sans-serif` — weight 400/500/600
- **Accent text (empty states, quotes):** `'Cormorant', Georgia, serif` — italic, matches APC's accent font

Font imports: Add `@fontsource/merriweather` via npm (matching the existing `@fontsource-variable/geist` pattern). Cormorant is not imported — use `Georgia, serif` italic as the accent fallback to avoid an extra dependency.

### Type Scale
- Logo/app title: `text-lg` Merriweather bold
- Channel header: `text-base` Merriweather semibold
- Message author: `text-sm` Geist semibold, color `#f15a24`
- Message body: `text-sm` Geist regular
- Timestamp: `text-xs` Geist, muted-foreground
- Input placeholder: `text-sm` Geist, muted-foreground

## Layout

### Overall Structure (unchanged)
```
<div class="flex h-dvh bg-background">
  <aside class="hidden md:flex w-64 flex-col border-r">  <!-- sidebar -->
  <div class="flex flex-1 flex-col overflow-hidden">      <!-- main -->
</div>
```

The sidebar width (w-64), responsive breakpoint (md:), and mobile drawer pattern stay the same. This is a visual reskin, not a layout restructure.

### Sidebar Details
- **Logo area:** "Magic Brooms" in Merriweather bold, `#f0e6d8`
- **Gradient divider:** Below logo — `linear-gradient(90deg, #f15a24, transparent)` height 1px
- **Channel list:** Standard vertical list
  - Active channel: `3px solid #f15a24` left border + `rgba(241,90,36,0.08)` background
  - Inactive channel: `#f0e6d8` at 40% opacity
  - Hover: `rgba(240,230,216,0.04)` background
  - Unread badge: small pill, `#f15a24` background
- **User footer:** Avatar (32px, circular) + display name + logout icon button

### Message Area
- **Channel header bar:** Merriweather channel name + member count in muted text. Bottom border.
- **Message layout:** Flat (no bubbles for others)
  - Avatar (32px) left-aligned
  - Author name in `#f15a24`, timestamp in muted, inline
  - Message body in `#f0e6d8`
  - Edit indicator: small "edited" text in muted
- **Own messages:** Subtle background tint `rgba(241,90,36,0.04)` on the message row
- **Date separators:** Thin line with centered date text, line uses gradient fade (`transparent → border-color → transparent`)
- **Reactions:** Pill-shaped, `rgba(240,230,216,0.06)` background, `rgba(240,230,216,0.1)` border. Active (user reacted): `rgba(241,90,36,0.1)` background, `rgba(241,90,36,0.3)` border
- **Message hover:** `rgba(240,230,216,0.02)` background, floating toolbar appears (edit/delete)
- **Message input:** Rounded, subtle border, inner glow `rgba(241,90,36,0.15)` on focus

### Auth Pages (Login, Signup, Forgot Password)
- Centered card (`max-w-md`) on `--background`
- Card title in Merriweather
- Subtle `#f15a24` accent line at top of card (4px, rounded)
- Form inputs: `--muted` background, `--border` border, warm text
- Primary button: `#f15a24` background, white text
- Error messages: `--destructive` background at 10% opacity, destructive text
- Footer links: `#2DA3CB` color

### Gallery
- Grid: 1 col mobile, 2 sm, 3 lg (unchanged)
- Cards: `--card` background, `--border` border
- Hover: border brightens to `rgba(240,230,216,0.12)`, subtle translateY(-1px)
- Card title: Merriweather
- Card meta (author, date): muted-foreground

### Gallery Card Detail
- Centered max-w-2xl
- Large image with rounded corners
- Title in Merriweather
- Same reaction/comment patterns as chat

### Profile Page
- Avatar with hover overlay for upload
- Form fields same style as auth pages
- Role badge uses `--secondary` (purple)

## Component Adjustments

All shadcn/ui primitives keep their structure. Changes are CSS-only via the custom property overrides plus targeted Tailwind class updates.

### Button Variants
- **Default (primary):** `bg-primary text-primary-foreground` — orange
- **Secondary:** `bg-secondary text-secondary-foreground` — purple
- **Ghost:** Transparent, hover `--muted`
- **Outline:** `--border` border, transparent bg
- **Destructive:** `bg-destructive text-destructive-foreground`

### Input/Textarea
- Background: `--muted`
- Border: `--border`
- Focus ring: `--ring` (orange at 40%)
- Text: `--foreground` (warm parchment)

### Card
- Background: `--card`
- Border: `--border`
- No box-shadow in dark mode (borders handle elevation)

### Dialog/AlertDialog
- Backdrop: `rgba(0,0,0,0.6)` (no blur — performance)
- Card styling for the dialog panel
- Orange accent line at top

### Avatar
- Border: `1px solid rgba(240,230,216,0.1)`
- Fallback background: `--secondary` (purple)

### Badge
- Default: `--primary` background
- Secondary: `--secondary` background
- Outline: `--border` border

### ScrollArea
- Scrollbar thumb: `rgba(240,230,216,0.1)`
- Scrollbar track: transparent

## Animation

- **Channel join shimmer:** Keep existing animation but update colors to orange/warm glow instead of orange/purple
- **Hover transitions:** `transition-colors duration-150` on interactive elements
- **No new animations.** Minimalist means restraint.

## Responsive Behavior

No changes to breakpoints or responsive structure. The existing `md:` breakpoint, Sheet drawer for mobile, and grid responsiveness all stay. Visual changes apply uniformly across breakpoints.

## Files to Modify

1. `bmad/app/src/index.css` — Replace CSS custom properties, add Merriweather import, update shimmer animation colors
2. `bmad/app/src/App.tsx` — Minor: ensure dark class is default (or remove toggle if present)
3. `bmad/app/src/components/shared/AppLayout.tsx` — Update sidebar classes: gradient divider, active channel left-border, user footer styling
4. `bmad/app/src/features/auth/LoginPage.tsx` — Card accent line, Merriweather title, button colors
5. `bmad/app/src/features/auth/SignupPage.tsx` — Same as LoginPage
6. `bmad/app/src/features/auth/ForgotPasswordPage.tsx` — Same as LoginPage
7. `bmad/app/src/features/channels/ChannelPage.tsx` — Channel header Merriweather treatment
8. `bmad/app/src/features/channels/ChatView.tsx` — Message author orange, own-message tint, reaction styling, input focus glow, date separator gradient
9. `bmad/app/src/features/gallery/GalleryView.tsx` — Card hover border, Merriweather titles
10. `bmad/app/src/features/gallery/GalleryCardDetail.tsx` — Same warm treatment
11. `bmad/app/src/features/profile/ProfilePage.tsx` — Form field styling, role badge
12. `bmad/app/src/components/ui/*.tsx` — Update default Tailwind classes in button, card, input, textarea, dialog, alert-dialog, avatar, badge, scroll-area to reference new tokens

## Files NOT Modified

- `bmad/app/src/hooks/*` — Data fetching untouched
- `bmad/app/src/lib/*` — Supabase client, utils untouched
- `bmad/app/src/stores/*` — State management untouched

## Success Criteria

1. `npm run build` passes with no errors
2. `npm run dev` renders correctly
3. All existing features work: auth, channels, messages, gallery, reactions, search, profile
4. APC brand colors (`#f15a24`, `#54548E`, `#2DA3CB`) are visually prominent
5. Merriweather serif appears in headings and logo
6. The app looks distinctly different from the current design and from standard chat apps
7. Responsive: works on desktop and mobile
