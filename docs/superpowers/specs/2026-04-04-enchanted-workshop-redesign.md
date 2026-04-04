# Magic Brooms UI Redesign: The Enchanted Workshop

**Date:** 2026-04-04
**Branch:** `design-variant-superpowers`
**Scope:** Full visual redesign of `bmad/app/` — CSS, components, and layout only. No hook/store/lib changes.

## Design Direction

Dark-mode-first "Enchanted Workshop" theme that evolves the existing mystical identity while aligning with the parent brand, A Portland Career (APC). APC's signature colors — orange `#f15a24`, purple `#54548E`, teal `#2DA3CB`, navy `#16163f` — become magical light sources against deep dark backgrounds. The result should feel like the after-hours, enchanted version of APC's professional warmth.

## Color System

Replace the current OKLCH token system with an APC-aligned palette. Dark mode is the default.

### Dark Mode (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0d0d2b` | Page background, deepest layer |
| `--background-raised` | `#12122e` | Slightly lifted surfaces |
| `--card` | `rgba(84, 84, 142, 0.10)` | Glass panel background |
| `--card-border` | `rgba(84, 84, 142, 0.15)` | Glass panel borders |
| `--foreground` | `rgba(255, 255, 255, 0.90)` | Primary text |
| `--foreground-muted` | `rgba(255, 255, 255, 0.50)` | Secondary text, timestamps |
| `--foreground-faint` | `rgba(255, 255, 255, 0.30)` | Tertiary text, placeholders |
| `--primary` | `#f15a24` | CTAs, active indicators, brand accent |
| `--primary-hover` | `#ff7849` | Hover state for primary |
| `--primary-glow` | `rgba(241, 90, 36, 0.15)` | Ambient glow behind primary elements |
| `--secondary` | `#54548E` | Purple accents, avatar gradients |
| `--teal` | `#2DA3CB` | Links, interactive elements, secondary accent |
| `--sidebar-bg` | `linear-gradient(180deg, #16163f, #0a0a25)` | Sidebar background gradient |
| `--sidebar-active` | `rgba(241, 90, 36, 0.15)` | Active channel background |
| `--sidebar-active-border` | `#f15a24` | Active channel left border |
| `--destructive` | `#ef4444` | Delete actions, errors |
| `--border` | `rgba(84, 84, 142, 0.15)` | Default borders |
| `--ring` | `rgba(241, 90, 36, 0.40)` | Focus ring color |
| `--input-bg` | `rgba(84, 84, 142, 0.15)` | Input field background |
| `--input-border` | `rgba(84, 84, 142, 0.25)` | Input field border |

### Light Mode

Light mode inverts the approach: white/warm-gray backgrounds with APC colors used at full saturation. Provided for accessibility/preference but dark is the hero experience.

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#f8f9fa` | Page background |
| `--card` | `#ffffff` | Card background |
| `--card-border` | `rgba(84, 84, 142, 0.12)` | Card borders |
| `--foreground` | `#16163f` | Primary text (navy) |
| `--foreground-muted` | `#666` | Secondary text |
| `--primary` | `#f15a24` | Same orange |
| `--secondary` | `#54548E` | Same purple |
| `--teal` | `#2DA3CB` | Same teal |
| `--sidebar-bg` | `#16163f` | Sidebar stays dark in both modes |

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Brand name | Merriweather (serif) | 700 | 20px |
| Page headings (h1, h2) | Merriweather (serif) | 700 | 24-28px |
| Section headings (h3) | Geist Variable (sans) | 600 | 16px |
| Body text | Geist Variable (sans) | 400 | 14px |
| Small text / timestamps | Geist Variable (sans) | 400 | 12px |
| Labels / uppercase | Geist Variable (sans) | 500 | 10-11px, letter-spacing 1.5px |

Add Merriweather via Google Fonts `<link>` in `index.html` or `@import` in `index.css`.

## Animations & Effects

All CSS-only. No JS animation libraries. All animations use `transform` and `opacity` for GPU compositing.

### Floating Particles

Sparse dots that drift slowly in the sidebar and login background. 3-5 particles per area.

```css
@keyframes particle-float {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
  50% { transform: translateY(-20px) translateX(5px); opacity: 0.7; }
}
```

Particles are `position: absolute` divs with `width: 2-3px`, colored with brand colors (orange, teal, purple), with `box-shadow` for glow effect. Animation duration: 4-8s each, staggered with `animation-delay`.

### Ember Glow

Pulse effect for active states, unread badges, and the send button.

```css
@keyframes ember-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(241, 90, 36, 0.2); }
  50% { box-shadow: 0 0 16px rgba(241, 90, 36, 0.4); }
}
```

### Message Fade-In

New messages slide up and fade in.

```css
@keyframes message-appear {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Duration: 300ms ease-out. Applied to newest message only to avoid scroll jank.

### Channel Join Shimmer

Update the existing `channel-join` animation to use the new orange/purple palette instead of the current gold/purple.

### Gallery Card Stagger

Cards fade in with a staggered delay on page load.

```css
.gallery-card { animation: message-appear 400ms ease-out backwards; }
.gallery-card:nth-child(1) { animation-delay: 0ms; }
.gallery-card:nth-child(2) { animation-delay: 80ms; }
/* etc. */
```

## Page-by-Page Specification

### Login Page (`LoginPage.tsx`)

**Layout:** Split hero — two panels, full viewport height.
- **Left panel (60%):** Brand showcase on navy gradient background.
  - Ambient radial glow (orange, centered)
  - Constellation dots (3-5 small positioned dots with faint connecting lines)
  - Merriweather serif "Magic Brooms" at 28px
  - "A Portland Career's Workshop" subtitle in teal, uppercase, 11px, letter-spacing 1px
  - Orange gradient line accent (40px wide, 2px tall)
- **Right panel (40%):** Glass-morphism form panel.
  - `background: rgba(84, 84, 142, 0.08)` with left border
  - "Sign In" heading, 14px, font-medium
  - Email and password inputs with `--input-bg` and `--input-border`
  - Orange gradient CTA button (`linear-gradient(90deg, #f15a24, #ff7849)`) with hover glow
  - "New here? Sign up" link in teal
  - "Forgot your incantation?" link in faint text
- **Mobile:** Stack vertically — brand section on top (compact), form below. Centered layout.
- **Error state:** Red-tinted glass panel with destructive text.

### Signup Page (`SignupPage.tsx`)

Same split hero layout as login. Left panel identical. Right panel has:
- "Begin Your Apprenticeship" heading
- Email, password, confirm password fields
- Orange gradient "Create Account" button
- "Already an apprentice? Sign in" link in teal

### Forgot Password Page (`ForgotPasswordPage.tsx`)

Same split hero layout. Right panel has:
- "Recovery Scroll" heading
- Email field only
- Orange gradient "Send Recovery Scroll" button
- Success state: teal-tinted glass panel with "Recovery Scroll Sent" message
- "Back to the Workshop" link

### App Layout (`AppLayout.tsx`)

**Desktop (md+):**
- Sidebar: `w-64`, fixed left, `--sidebar-bg` gradient
- Main content: `flex-1`, `background: --background`
- No changes to structural layout, only visual treatment

**Mobile:**
- Hidden sidebar, Sheet drawer from left (existing pattern)
- Mobile header: `background: --background-raised`, `border-bottom: --border`
- Menu icon, channel name (truncated), profile avatar link
- Drawer uses same sidebar styling

**Sidebar content:**
- **Header:** Merriweather "Magic Brooms" in orange gradient text (`background-clip: text`). "The Workshop" subtitle in teal, 10px uppercase.
- **Search:** `--input-bg` background, `--input-border` border, rounded-lg. Placeholder in `--foreground-faint`.
- **Channel list:** ScrollArea. Each channel item:
  - Default: `--foreground-muted` text, `hover: rgba(84, 84, 142, 0.08)` background
  - Active: `--sidebar-active` background, `--sidebar-active-border` left border (3px), `--foreground` text, font-medium
  - Unread badge: `--primary` background, white text, ember-glow animation
  - Non-member: italic, `--foreground-faint`, "(join)" label
- **User section:** Bottom of sidebar, border-top with `--border`. Gradient avatar ring (purple→teal). Display name + role subtitle. Logout button ghost-styled.
- **Floating particles:** 3 absolutely-positioned particle dots with `particle-float` animation, staggered delays. Colors: orange, teal, purple.
- **Create channel button:** Ghost button with teal text, `hover: --primary-glow` background.

### Chat View (`ChatView.tsx`)

**Header (desktop only):**
- Channel name in Merriweather serif, 20px
- Description in `--foreground-muted`, 13px
- Bottom border with `--border`

**Message list:**
- `background: --background`
- Date separators: centered text in `--foreground-faint`, 11px, with `--border` lines on each side
- Each message: glass panel card
  - `background: --card`, `border: --card-border`, `border-radius: 10px`
  - Padding: 12px 16px
  - Avatar: 32px, gradient ring (author-unique colors from purple/teal/orange), rounded-full
  - Author name: 13px, font-semibold, `--foreground`
  - Timestamp: 10px, `--foreground-faint`
  - Message text: 13px, `--foreground` at 0.75 opacity, line-height 1.6
  - "(edited)" indicator: 10px, `--foreground-faint`
- **Reactions:** Below message content.
  - Each pill: `background: rgba(241, 90, 36, 0.12)`, `border: rgba(241, 90, 36, 0.2)`, rounded-full
  - User's own reaction: `border: rgba(241, 90, 36, 0.5)`, `background: rgba(241, 90, 36, 0.18)`
  - Emoji + count, 11px
- **Hover toolbar:** Appears on hover (desktop) / long-press (mobile).
  - `background: rgba(22, 22, 63, 0.95)`, `border: rgba(84, 84, 142, 0.3)`, `box-shadow`, `border-radius: 6px`
  - Emoji, edit, delete icon buttons
- **Message input area:**
  - Bottom of view, padding 16px
  - Textarea: `--input-bg`, `--input-border`, rounded-lg
  - Send button: orange gradient, icon-sized, ember-glow on hover
- **New message animation:** `message-appear` on latest message

### Gallery View (`GalleryView.tsx`)

**Header:**
- Channel name in Merriweather serif
- "New Card" button: orange gradient, matching login CTA style

**Grid:**
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- Each card: glass panel styling (`--card`, `--card-border`, rounded-xl)
  - Image: `aspect-video`, `object-cover`, `rounded-t-xl`
  - Title: 15px, font-medium, `--foreground`
  - Description: 13px, `--foreground-muted`, line-clamp-2
  - Footer: author + date in 12px `--foreground-faint`
  - Hover: `border-color: rgba(241, 90, 36, 0.3)`, `box-shadow: 0 0 20px rgba(241, 90, 36, 0.1)`
- Staggered fade-in animation on load

**Create card dialog:**
- Glass-morphism dialog matching auth page card styling
- Dark backdrop with blur
- Orange gradient create button

### Gallery Card Detail (`GalleryCardDetail.tsx`)

- Centered `max-w-2xl` layout on `--background`
- Back link: teal colored with arrow, hover brightens
- Card image: full-width, rounded-lg
- Title: Merriweather serif, 24px
- Metadata: 13px, `--foreground-muted`
- Description: 14px, `--foreground` at 0.8 opacity
- Link button: teal, underline on hover
- Reactions: same ember-pill style as chat
- Comments: glass panel per comment, avatar + author + time + text
- Comment form: textarea + orange "Post" button

### Profile Page (`ProfilePage.tsx`)

- Centered `max-w-md` glass panel card on `--background`
- Avatar: 80px, static gradient ring (purple→teal), hover overlay for upload
- Camera icon on hover
- "Remove photo" in destructive color
- Display name input: `--input-bg` styling
- Role: teal colored, uppercase, 11px
- "Update Profile" button: orange gradient
- Success feedback: teal "Saved!" text
- Back link: teal

## UI Primitives Updates

All components in `bmad/app/src/components/ui/` need dark-mode-first treatment:

- **Button:** Default variant uses orange gradient. Ghost/outline variants use `--border` and `--foreground-muted`. Destructive uses `--destructive`. Focus ring uses `--ring` (orange-tinted).
- **Card:** Glass-morphism: `--card` background, `--card-border` border. No ring — border only.
- **Input:** `--input-bg` background, `--input-border` border. Focus: `--ring`. Placeholder: `--foreground-faint`.
- **Textarea:** Same as Input treatment.
- **Label:** `--foreground-muted` default color.
- **Avatar:** Add gradient ring option. Fallback bg uses `--secondary`.
- **Badge:** Default uses `--primary` bg. Secondary uses glass styling. Unread badges get ember-glow.
- **Dialog:** Glass-morphism panel. `backdrop-blur-sm`. `background: rgba(22, 22, 63, 0.9)`. Border: `--card-border`.
- **AlertDialog:** Same as Dialog.
- **Sheet:** Uses sidebar colors for consistency.
- **Separator:** `--border` color.
- **ScrollArea:** Thumb uses `--secondary` at 0.3 opacity.
- **Tabs:** Active tab: `--primary` underline or `--primary-glow` background. Inactive: `--foreground-muted`.
- **Tooltip:** `--secondary` background, white text.
- **DropdownMenu:** Glass-morphism panel, same as Dialog.

## Responsive Behavior

No structural changes to the responsive strategy. Same `md` breakpoint.

- **Mobile auth pages:** Stack the split hero vertically. Brand section becomes a compact header (broom icon + brand name + subtitle). Form takes remaining space.
- **Mobile sidebar:** Sheet drawer, same enchanted styling.
- **Mobile messages:** Glass panels get slightly less padding (10px 12px) for screen real estate.
- **Mobile gallery:** Single column, full-width cards.

## Files Modified

### Must change:
1. `bmad/app/src/index.css` — Complete color token replacement, new animations, Merriweather import
2. `bmad/app/src/components/shared/AppLayout.tsx` — Sidebar visual overhaul, particles, mobile header
3. `bmad/app/src/features/auth/LoginPage.tsx` — Split hero layout
4. `bmad/app/src/features/auth/SignupPage.tsx` — Split hero layout
5. `bmad/app/src/features/auth/ForgotPasswordPage.tsx` — Split hero layout
6. `bmad/app/src/features/channels/ChatView.tsx` — Glass panel messages, updated reactions
7. `bmad/app/src/features/gallery/GalleryView.tsx` — Glass cards, staggered animation
8. `bmad/app/src/features/gallery/GalleryCardDetail.tsx` — Glass panel detail, teal accents
9. `bmad/app/src/features/profile/ProfilePage.tsx` — Glass card profile, gradient avatar
10. `bmad/app/src/components/ui/button.tsx` — Orange gradient default, dark variants
11. `bmad/app/src/components/ui/card.tsx` — Glass-morphism treatment
12. `bmad/app/src/components/ui/input.tsx` — Dark input styling
13. `bmad/app/src/components/ui/badge.tsx` — Ember glow for unread
14. `bmad/app/src/components/ui/dialog.tsx` — Glass-morphism
15. `bmad/app/src/components/ui/alert-dialog.tsx` — Glass-morphism
16. `bmad/app/src/components/ui/avatar.tsx` — Gradient ring option
17. `bmad/app/src/components/ui/textarea.tsx` — Dark input styling
18. `bmad/app/src/components/ui/tooltip.tsx` — Purple background
19. `bmad/app/src/components/ui/tabs.tsx` — Orange active state
20. `bmad/app/src/components/ui/scroll-area.tsx` — Subtle thumb
21. `bmad/app/src/components/ui/sheet.tsx` — Sidebar colors
22. `bmad/app/src/components/ui/separator.tsx` — Border color
23. `bmad/app/src/components/ui/label.tsx` — Muted foreground
24. `bmad/app/src/components/ui/dropdown-menu.tsx` — Glass-morphism

### May need change:
25. `bmad/app/index.html` — Google Fonts link for Merriweather (if not using CSS @import)
26. `bmad/app/src/App.tsx` — Only if dark mode class needs to be set on mount

### Off-limits:
- `bmad/app/src/hooks/*`
- `bmad/app/src/lib/*`
- `bmad/app/src/stores/*`

## Success Criteria

1. `npm run dev` from `bmad/app/` works without errors
2. `npm run build` passes (TypeScript clean)
3. All existing features functional: auth, channels, messages, gallery, reactions, search, profile
4. Dark mode is visually cohesive — no white/light flashes from unstyled components
5. APC brand colors recognizable throughout
6. Responsive: mobile drawer, stacked auth, single-column gallery all work
7. Animations are smooth (no layout thrashing, all GPU-composited)
8. Stands out visually against 4 competing AI tool redesigns
