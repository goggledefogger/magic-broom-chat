# Ember & Ink Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the Magic Brooms chat app with the "Ember & Ink" design — dark mode with warm parchment text, APC brand colors, and Merriweather serif headings.

**Architecture:** This is a pure visual reskin. All changes are CSS custom properties (index.css) and Tailwind class updates in component files. No logic, hooks, state, or API changes. The color system in index.css drives 80% of the transformation; the remaining 20% is targeted class additions for serif fonts, active-channel borders, own-message tints, and input focus glows.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI primitives), @fontsource/merriweather

---

## File Map

| File | Change Type | Responsibility |
|------|------------|----------------|
| `bmad/app/src/index.css` | Major rewrite | Color system, font imports, animation colors |
| `bmad/app/src/App.tsx` | Minor tweak | Welcome page serif treatment |
| `bmad/app/src/components/shared/AppLayout.tsx` | Moderate | Sidebar: gradient divider, active channel left-border, user footer |
| `bmad/app/src/features/channels/ChatView.tsx` | Moderate | Author name orange, own-message tint, date separator gradient, input focus glow |
| `bmad/app/src/features/auth/LoginPage.tsx` | Minor | Card accent line, serif title, link colors |
| `bmad/app/src/features/auth/SignupPage.tsx` | Minor | Same as LoginPage |
| `bmad/app/src/features/auth/ForgotPasswordPage.tsx` | Minor | Same as LoginPage |
| `bmad/app/src/features/gallery/GalleryView.tsx` | Minor | Serif title, card hover border |
| `bmad/app/src/features/gallery/GalleryCardDetail.tsx` | Minor | Serif headings, link color |
| `bmad/app/src/features/channels/ChannelPage.tsx` | No change | Already uses semantic color tokens |
| `bmad/app/src/features/profile/ProfilePage.tsx` | Minor | Serif title, role badge color |
| `bmad/app/src/components/ui/*.tsx` | No change | Already use semantic tokens; new colors flow through automatically |

---

### Task 1: Install Merriweather Font and Rewrite Color System

**Files:**
- Modify: `bmad/app/package.json` (add dependency)
- Modify: `bmad/app/src/index.css` (full rewrite of theme section)

This is the foundation. Everything else builds on these colors and fonts.

- [ ] **Step 1: Install Merriweather font package**

Run from `bmad/app/`:
```bash
cd bmad/app && npm install @fontsource/merriweather
```

Expected: Package added to `package.json` dependencies.

- [ ] **Step 2: Rewrite index.css**

Replace the entire contents of `bmad/app/src/index.css` with:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/geist";
@import "@fontsource/merriweather/700.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
    --font-heading: 'Merriweather', Georgia, serif;
    --font-sans: 'Geist Variable', sans-serif;
    --color-sidebar-ring: var(--sidebar-ring);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar: var(--sidebar);
    --color-chart-5: var(--chart-5);
    --color-chart-4: var(--chart-4);
    --color-chart-3: var(--chart-3);
    --color-chart-2: var(--chart-2);
    --color-chart-1: var(--chart-1);
    --color-ring: var(--ring);
    --color-input: var(--input);
    --color-border: var(--border);
    --color-destructive: var(--destructive);
    --color-accent-foreground: var(--accent-foreground);
    --color-accent: var(--accent);
    --color-muted-foreground: var(--muted-foreground);
    --color-muted: var(--muted);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-secondary: var(--secondary);
    --color-primary-foreground: var(--primary-foreground);
    --color-primary: var(--primary);
    --color-popover-foreground: var(--popover-foreground);
    --color-popover: var(--popover);
    --color-card-foreground: var(--card-foreground);
    --color-card: var(--card);
    --color-foreground: var(--foreground);
    --color-background: var(--background);
    --radius-sm: calc(var(--radius) * 0.6);
    --radius-md: calc(var(--radius) * 0.8);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) * 1.4);
    --radius-2xl: calc(var(--radius) * 1.8);
    --radius-3xl: calc(var(--radius) * 2.2);
    --radius-4xl: calc(var(--radius) * 2.6);
}

/* Ember & Ink Theme — dark, warm, mystical, APC-aligned */
:root {
    --background: #111827;
    --foreground: #f0e6d8;
    --card: #1a2030;
    --card-foreground: #f0e6d8;
    --popover: #1a2030;
    --popover-foreground: #f0e6d8;
    --primary: #f15a24;
    --primary-foreground: #ffffff;
    --secondary: #54548E;
    --secondary-foreground: #f0e6d8;
    --muted: #222a3a;
    --muted-foreground: rgba(240, 230, 216, 0.5);
    --accent: #2DA3CB;
    --accent-foreground: #ffffff;
    --destructive: #e53e3e;
    --border: rgba(240, 230, 216, 0.06);
    --input: rgba(240, 230, 216, 0.06);
    --ring: rgba(241, 90, 36, 0.4);
    --chart-1: #f15a24;
    --chart-2: #54548E;
    --chart-3: #2DA3CB;
    --chart-4: #e53e3e;
    --chart-5: #f0e6d8;
    --radius: 0.625rem;
    --sidebar: #151c2a;
    --sidebar-foreground: #f0e6d8;
    --sidebar-primary: #f15a24;
    --sidebar-primary-foreground: #ffffff;
    --sidebar-accent: rgba(241, 90, 36, 0.08);
    --sidebar-accent-foreground: #f0e6d8;
    --sidebar-border: rgba(240, 230, 216, 0.06);
    --sidebar-ring: rgba(241, 90, 36, 0.4);
}

/* No separate .dark block — this IS the dark theme */

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}

/* Channel join animation — ember shimmer */
@keyframes channel-join {
  0% {
    background-color: transparent;
    box-shadow: none;
  }
  20% {
    background-color: rgba(241, 90, 36, 0.15);
    box-shadow: 0 0 8px rgba(241, 90, 36, 0.3);
  }
  50% {
    background-color: rgba(84, 84, 142, 0.1);
    box-shadow: 0 0 12px rgba(84, 84, 142, 0.2);
  }
  100% {
    background-color: transparent;
    box-shadow: none;
  }
}

.animate-channel-join {
  animation: channel-join 1.2s ease-out;
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 3: Verify build**

```bash
cd bmad/app && npm run build
```

Expected: Build succeeds. The app now uses the Ember & Ink color system globally. All shadcn/ui components automatically pick up the new colors via CSS custom properties.

- [ ] **Step 4: Commit**

```bash
git add bmad/app/package.json bmad/app/package-lock.json bmad/app/src/index.css
git commit -m "feat: Ember & Ink color system and Merriweather font

Replace Sorcerer's Apprentice oklch theme with Ember & Ink hex colors.
APC brand alignment: #f15a24 orange, #54548E purple, #2DA3CB blue.
Add Merriweather serif as heading font."
```

---

### Task 2: Update AppLayout Sidebar

**Files:**
- Modify: `bmad/app/src/components/shared/AppLayout.tsx`

Add the gradient divider under the logo, active channel left-border, and user footer styling.

- [ ] **Step 1: Update the logo area and add gradient divider**

In `AppLayout.tsx`, in the `SidebarContent` function, replace lines 72-75:

```tsx
// OLD:
<div className="flex items-center gap-2 p-4">
  <h1 className="text-lg font-bold text-sidebar-primary">Magic Brooms</h1>
</div>
<Separator className="bg-sidebar-border" />
```

With:

```tsx
// NEW:
<div className="flex items-center gap-2 p-4">
  <h1 className="font-heading text-lg font-bold text-sidebar-foreground">Magic Brooms</h1>
</div>
<div className="h-px bg-gradient-to-r from-primary to-transparent" />
```

- [ ] **Step 2: Update the active channel styling with left-border**

In `AppLayout.tsx`, replace the channel Link className (around line 139-143):

```tsx
// OLD:
className={`flex-1 rounded px-2 py-1.5 text-sm transition-colors ${
  isActive
    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
} ${badgeCount > 0 ? 'font-bold' : ''}`}
```

With:

```tsx
// NEW:
className={`flex-1 rounded px-2 py-1.5 text-sm transition-colors ${
  isActive
    ? 'border-l-3 border-l-primary bg-sidebar-accent text-sidebar-accent-foreground font-medium pl-3'
    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
} ${badgeCount > 0 ? 'font-bold' : ''}`}
```

- [ ] **Step 3: Update unread badge to use primary color**

In `AppLayout.tsx`, update the Badge around line 149-152:

```tsx
// OLD:
<Badge variant="secondary" className="ml-1 h-4 min-w-4 justify-center px-1 text-[10px]">
```

With:

```tsx
// NEW:
<Badge variant="default" className="ml-1 h-4 min-w-4 justify-center px-1 text-[10px]">
```

- [ ] **Step 4: Update user section with avatar**

In `AppLayout.tsx`, replace the user section (lines 172-185):

```tsx
// OLD:
<Separator className="bg-sidebar-border" />
<div className="flex items-center justify-between p-3">
  <Link to="/profile" className="text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground">
    {profile?.displayName ?? user?.email ?? 'Apprentice'}
  </Link>
  <Button
    variant="ghost"
    size="sm"
    onClick={onSignOut}
    className="h-6 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
  >
    Logout
  </Button>
</div>
```

With:

```tsx
// NEW:
<div className="h-px bg-sidebar-border" />
<div className="flex items-center gap-3 p-3">
  <Link to="/profile" className="flex items-center gap-2 flex-1 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
      {(profile?.displayName ?? user?.email ?? '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
    </div>
    <span>{profile?.displayName ?? user?.email ?? 'Apprentice'}</span>
  </Link>
  <Button
    variant="ghost"
    size="sm"
    onClick={onSignOut}
    className="h-6 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
  >
    Logout
  </Button>
</div>
```

- [ ] **Step 5: Update mobile header with serif treatment**

In `AppLayout.tsx`, replace the mobile header span (around line 381):

```tsx
// OLD:
<span className="flex-1 text-sm font-semibold truncate">
  {currentChannel ? `#${currentChannel.name}` : 'Magic Brooms'}
</span>
```

With:

```tsx
// NEW:
<span className="flex-1 font-heading text-sm font-semibold truncate">
  {currentChannel ? `#${currentChannel.name}` : 'Magic Brooms'}
</span>
```

- [ ] **Step 6: Verify build**

```bash
cd bmad/app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add bmad/app/src/components/shared/AppLayout.tsx
git commit -m "feat: Ember & Ink sidebar — gradient divider, left-border active channel, avatar footer"
```

---

### Task 3: Update ChatView

**Files:**
- Modify: `bmad/app/src/features/channels/ChatView.tsx`

Add orange author names, own-message tint, gradient date separators, and input focus glow.

- [ ] **Step 1: Update author name to primary color**

In `ChatView.tsx`, in the `MessageItem` component, replace the author name span (line 198):

```tsx
// OLD:
<span className="text-sm font-semibold">{authorName}</span>
```

With:

```tsx
// NEW:
<span className="text-sm font-semibold text-primary">{authorName}</span>
```

- [ ] **Step 2: Add own-message tint**

In `ChatView.tsx`, update the message row div className (line 186):

```tsx
// OLD:
className="group relative flex gap-3 px-4 py-2 hover:bg-muted/30"
```

With:

```tsx
// NEW:
className={`group relative flex gap-3 px-4 py-2 hover:bg-muted/30 ${isOwn ? 'bg-primary/[0.04]' : ''}`}
```

- [ ] **Step 3: Update date separator with gradient lines**

In `ChatView.tsx`, replace the date separator block (lines 375-378):

```tsx
// OLD:
<div className="relative my-4 flex items-center px-4">
  <Separator className="flex-1" />
  <span className="px-3 text-xs text-muted-foreground">{group.date}</span>
  <Separator className="flex-1" />
</div>
```

With:

```tsx
// NEW:
<div className="relative my-4 flex items-center px-4">
  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
  <span className="px-3 text-xs text-muted-foreground">{group.date}</span>
  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
</div>
```

- [ ] **Step 4: Update channel header with serif font**

In `ChatView.tsx`, replace the channel header h2 (line 355):

```tsx
// OLD:
<h2 className="text-lg font-semibold">#{channel?.name}</h2>
```

With:

```tsx
// NEW:
<h2 className="font-heading text-lg font-semibold">#{channel?.name}</h2>
```

- [ ] **Step 5: Add focus glow to message input**

In `ChatView.tsx`, update the message input Textarea (around line 398-404):

```tsx
// OLD:
<Textarea
  placeholder={`Message #${channel?.name ?? '...'}`}
  value={content}
  onChange={(e) => setContent(e.target.value)}
  onKeyDown={handleKeyDown}
  className="min-h-[40px] max-h-[120px] resize-none"
  rows={1}
/>
```

With:

```tsx
// NEW:
<Textarea
  placeholder={`Message #${channel?.name ?? '...'}`}
  value={content}
  onChange={(e) => setContent(e.target.value)}
  onKeyDown={handleKeyDown}
  className="min-h-[40px] max-h-[120px] resize-none focus-visible:ring-primary/20"
  rows={1}
/>
```

- [ ] **Step 6: Verify build**

```bash
cd bmad/app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add bmad/app/src/features/channels/ChatView.tsx
git commit -m "feat: Ember & Ink chat — orange authors, own-message tint, gradient date separators"
```

---

### Task 4: Update Auth Pages (Login, Signup, ForgotPassword)

**Files:**
- Modify: `bmad/app/src/features/auth/LoginPage.tsx`
- Modify: `bmad/app/src/features/auth/SignupPage.tsx`
- Modify: `bmad/app/src/features/auth/ForgotPasswordPage.tsx`

Add accent line at top of card, serif titles, and accent-colored footer links.

- [ ] **Step 1: Update LoginPage.tsx**

Replace the Card block (lines 35-86):

```tsx
// OLD card opening:
<Card className="w-full max-w-md">
  <CardHeader className="text-center">
    <CardTitle className="text-2xl">Enter the Workshop</CardTitle>
```

With:

```tsx
// NEW card opening:
<Card className="w-full max-w-md border-t-4 border-t-primary">
  <CardHeader className="text-center">
    <CardTitle className="font-heading text-2xl">Enter the Workshop</CardTitle>
```

Then update the footer links (lines 77-81):

```tsx
// OLD:
<Link to="/signup" className="text-muted-foreground hover:text-foreground">
  New apprentice? Sign up
</Link>
<Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">
  Forgot password?
</Link>
```

With:

```tsx
// NEW:
<Link to="/signup" className="text-accent hover:text-accent/80">
  New apprentice? Sign up
</Link>
<Link to="/forgot-password" className="text-accent hover:text-accent/80">
  Forgot password?
</Link>
```

- [ ] **Step 2: Update SignupPage.tsx**

Apply the same pattern. For the main form card (line 64):

```tsx
// OLD:
<Card className="w-full max-w-md">
  <CardHeader className="text-center">
    <CardTitle className="text-2xl">Begin Your Apprenticeship</CardTitle>
```

With:

```tsx
// NEW:
<Card className="w-full max-w-md border-t-4 border-t-primary">
  <CardHeader className="text-center">
    <CardTitle className="font-heading text-2xl">Begin Your Apprenticeship</CardTitle>
```

For the confirmation card (line 45):

```tsx
// OLD:
<Card className="w-full max-w-md">
  <CardHeader className="text-center">
    <CardTitle className="text-2xl">Scroll Dispatched</CardTitle>
```

With:

```tsx
// NEW:
<Card className="w-full max-w-md border-t-4 border-t-primary">
  <CardHeader className="text-center">
    <CardTitle className="font-heading text-2xl">Scroll Dispatched</CardTitle>
```

Update the footer link (line 116):

```tsx
// OLD:
<Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
```

With:

```tsx
// NEW:
<Link to="/login" className="text-sm text-accent hover:text-accent/80">
```

And the confirmation footer link (line 53):

```tsx
// OLD:
<Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
```

With:

```tsx
// NEW:
<Link to="/login" className="text-sm text-accent hover:text-accent/80">
```

- [ ] **Step 3: Update ForgotPasswordPage.tsx**

Same pattern. Main form card (line 56):

```tsx
// OLD:
<Card className="w-full max-w-md">
  <CardHeader className="text-center">
    <CardTitle className="text-2xl">Forgot Your Incantation?</CardTitle>
```

With:

```tsx
// NEW:
<Card className="w-full max-w-md border-t-4 border-t-primary">
  <CardHeader className="text-center">
    <CardTitle className="font-heading text-2xl">Forgot Your Incantation?</CardTitle>
```

Confirmation card (line 36):

```tsx
// OLD:
<Card className="w-full max-w-md">
  <CardHeader className="text-center">
    <CardTitle className="text-2xl">Recovery Scroll Sent</CardTitle>
```

With:

```tsx
// NEW:
<Card className="w-full max-w-md border-t-4 border-t-primary">
  <CardHeader className="text-center">
    <CardTitle className="font-heading text-2xl">Recovery Scroll Sent</CardTitle>
```

Update both footer links to use accent color:

```tsx
// OLD (both instances):
<Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
```

With:

```tsx
// NEW:
<Link to="/login" className="text-sm text-accent hover:text-accent/80">
```

- [ ] **Step 4: Verify build**

```bash
cd bmad/app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add bmad/app/src/features/auth/LoginPage.tsx bmad/app/src/features/auth/SignupPage.tsx bmad/app/src/features/auth/ForgotPasswordPage.tsx
git commit -m "feat: Ember & Ink auth pages — accent card border, serif titles, blue links"
```

---

### Task 5: Update Gallery Pages

**Files:**
- Modify: `bmad/app/src/features/gallery/GalleryView.tsx`
- Modify: `bmad/app/src/features/gallery/GalleryCardDetail.tsx`

Add serif headings and warm hover effects.

- [ ] **Step 1: Update GalleryView.tsx**

Update the header h2 (line 68):

```tsx
// OLD:
<h2 className="text-lg font-semibold">#{channel?.name}</h2>
```

With:

```tsx
// NEW:
<h2 className="font-heading text-lg font-semibold">#{channel?.name}</h2>
```

Update the gallery Card hover (line 148):

```tsx
// OLD:
className="cursor-pointer transition-shadow hover:shadow-md"
```

With:

```tsx
// NEW:
className="cursor-pointer transition-all hover:border-foreground/10 hover:-translate-y-0.5"
```

Update CardTitle to use serif (line 161):

```tsx
// OLD:
<CardTitle className="text-base">{card.title}</CardTitle>
```

With:

```tsx
// NEW:
<CardTitle className="font-heading text-base">{card.title}</CardTitle>
```

- [ ] **Step 2: Update GalleryCardDetail.tsx**

Update the card title h1 (line 99):

```tsx
// OLD:
<h1 className="mb-2 text-2xl font-bold">{card.title}</h1>
```

With:

```tsx
// NEW:
<h1 className="font-heading mb-2 text-2xl font-bold">{card.title}</h1>
```

Update the comments heading (line 170):

```tsx
// OLD:
<h2 className="mb-4 text-lg font-semibold">Comments</h2>
```

With:

```tsx
// NEW:
<h2 className="font-heading mb-4 text-lg font-semibold">Comments</h2>
```

Update the link color (line 115):

```tsx
// OLD:
className="mb-4 inline-block text-sm text-primary underline hover:text-primary/80"
```

With:

```tsx
// NEW:
className="mb-4 inline-block text-sm text-accent underline hover:text-accent/80"
```

Update comment author names to primary color. In the comment map (line 194):

```tsx
// OLD:
<span className="text-sm font-semibold">{authorName}</span>
```

With:

```tsx
// NEW:
<span className="text-sm font-semibold text-primary">{authorName}</span>
```

- [ ] **Step 3: Verify build**

```bash
cd bmad/app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add bmad/app/src/features/gallery/GalleryView.tsx bmad/app/src/features/gallery/GalleryCardDetail.tsx
git commit -m "feat: Ember & Ink gallery — serif headings, warm hover effects, accent links"
```

---

### Task 6: Update ProfilePage and App Welcome

**Files:**
- Modify: `bmad/app/src/features/profile/ProfilePage.tsx`
- Modify: `bmad/app/src/App.tsx`

Serif headings and role badge color.

- [ ] **Step 1: Update ProfilePage.tsx**

Update the card title (line 152):

```tsx
// OLD:
<CardTitle className="text-2xl">Your Profile</CardTitle>
```

With:

```tsx
// NEW:
<CardTitle className="font-heading text-2xl">Your Profile</CardTitle>
```

Add border-t to card (line 107):

```tsx
// OLD:
<Card className="w-full max-w-md">
```

With:

```tsx
// NEW:
<Card className="w-full max-w-md border-t-4 border-t-primary">
```

Update the role display to use a badge-like style (line 169):

```tsx
// OLD:
<p className="text-sm capitalize">{profile?.role ?? 'student'}</p>
```

With:

```tsx
// NEW:
<p className="inline-block rounded-full bg-secondary/20 px-3 py-0.5 text-sm capitalize text-secondary">{profile?.role ?? 'student'}</p>
```

Update the back link (line 184-187):

```tsx
// OLD:
<Link
  to="/channels"
  className="text-sm text-muted-foreground hover:text-foreground"
>
```

With:

```tsx
// NEW:
<Link
  to="/channels"
  className="text-sm text-accent hover:text-accent/80"
>
```

- [ ] **Step 2: Update App.tsx welcome page**

In `App.tsx`, update the welcome message (lines 69-74):

```tsx
// OLD:
<div className="text-center space-y-2">
  <p className="text-2xl">Welcome to the workshop</p>
  <p className="text-sm">Select a channel to begin</p>
</div>
```

With:

```tsx
// NEW:
<div className="text-center space-y-2">
  <p className="font-heading text-2xl">Welcome to the workshop</p>
  <p className="text-sm">Select a channel to begin</p>
</div>
```

- [ ] **Step 3: Verify build**

```bash
cd bmad/app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add bmad/app/src/features/profile/ProfilePage.tsx bmad/app/src/App.tsx
git commit -m "feat: Ember & Ink profile and welcome — serif headings, role badge, accent links"
```

---

### Task 7: Final Verification and Dev Server Check

**Files:** None — verification only.

- [ ] **Step 1: Run build**

```bash
cd bmad/app && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Start dev server**

```bash
cd bmad/app && npm run dev
```

Expected: Dev server starts at localhost:5173. Visually confirm:
- Dark background with warm parchment text
- Orange (#f15a24) accent on buttons, active channel border, author names
- Merriweather serif on headings (logo, channel headers, card titles, auth page titles)
- Purple (#54548E) on avatar fallbacks, role badge
- Blue (#2DA3CB) on footer links in auth pages
- Gradient divider under sidebar logo
- Own-message tint visible in chat
- Gradient date separators in chat

- [ ] **Step 3: Stop dev server and confirm no uncommitted changes**

```bash
cd bmad/app && git status
```

Expected: Working tree clean.
