# Enchanted Workshop UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Magic Brooms chat app with a dark-mode-first "Enchanted Workshop" theme aligned with A Portland Career's brand colors.

**Architecture:** Replace the OKLCH color token system with APC-aligned hex palette (navy/purple/orange/teal). Add Merriweather serif font for headings. Restyle all pages and UI primitives for dark glass-morphism aesthetic. Add CSS-only animations for particles, glows, and transitions. No changes to hooks, stores, or lib code.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui (@base-ui), Merriweather font (Google Fonts), Geist Variable font, CSS animations

**Spec:** `docs/superpowers/specs/2026-04-04-enchanted-workshop-redesign.md`

---

### Task 1: Foundation — Color Tokens, Fonts, and Animations

**Files:**
- Modify: `bmad/app/index.html`
- Modify: `bmad/app/src/index.css`

This is the foundation everything else depends on. Replace the entire color system and add animations.

- [ ] **Step 1: Add Merriweather font to index.html**

In `bmad/app/index.html`, add Google Fonts link in `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700&display=swap" rel="stylesheet">
```

Add `class="dark"` to the `<html>` tag to enable dark mode by default:

```html
<html lang="en" class="dark">
```

- [ ] **Step 2: Replace index.css color tokens and add animations**

Replace the entire contents of `bmad/app/src/index.css` with:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/geist";

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

/* Enchanted Workshop Theme — APC-aligned, dark-mode-first */
:root {
    --background: #f8f9fa;
    --foreground: #16163f;
    --card: #ffffff;
    --card-foreground: #16163f;
    --popover: #ffffff;
    --popover-foreground: #16163f;
    --primary: #f15a24;
    --primary-foreground: #ffffff;
    --secondary: #54548E;
    --secondary-foreground: #ffffff;
    --muted: #eef0f4;
    --muted-foreground: #64648a;
    --accent: #2DA3CB;
    --accent-foreground: #ffffff;
    --destructive: #ef4444;
    --border: rgba(84, 84, 142, 0.15);
    --input: rgba(84, 84, 142, 0.15);
    --ring: rgba(241, 90, 36, 0.4);
    --chart-1: #f15a24;
    --chart-2: #54548E;
    --chart-3: #2DA3CB;
    --chart-4: #ff7849;
    --chart-5: #7a7ab8;
    --radius: 0.625rem;
    --sidebar: #16163f;
    --sidebar-foreground: rgba(255, 255, 255, 0.9);
    --sidebar-primary: #f15a24;
    --sidebar-primary-foreground: #ffffff;
    --sidebar-accent: rgba(241, 90, 36, 0.15);
    --sidebar-accent-foreground: rgba(255, 255, 255, 0.95);
    --sidebar-border: rgba(84, 84, 142, 0.2);
    --sidebar-ring: rgba(241, 90, 36, 0.4);
}

.dark {
    --background: #0d0d2b;
    --foreground: rgba(255, 255, 255, 0.9);
    --card: rgba(84, 84, 142, 0.10);
    --card-foreground: rgba(255, 255, 255, 0.9);
    --popover: rgba(22, 22, 63, 0.95);
    --popover-foreground: rgba(255, 255, 255, 0.9);
    --primary: #f15a24;
    --primary-foreground: #ffffff;
    --secondary: rgba(84, 84, 142, 0.25);
    --secondary-foreground: rgba(255, 255, 255, 0.9);
    --muted: rgba(84, 84, 142, 0.15);
    --muted-foreground: rgba(255, 255, 255, 0.5);
    --accent: #2DA3CB;
    --accent-foreground: #ffffff;
    --destructive: #ef4444;
    --border: rgba(84, 84, 142, 0.15);
    --input: rgba(84, 84, 142, 0.25);
    --ring: rgba(241, 90, 36, 0.4);
    --chart-1: #f15a24;
    --chart-2: #54548E;
    --chart-3: #2DA3CB;
    --chart-4: #ff7849;
    --chart-5: #7a7ab8;
    --sidebar: #16163f;
    --sidebar-foreground: rgba(255, 255, 255, 0.9);
    --sidebar-primary: #f15a24;
    --sidebar-primary-foreground: #ffffff;
    --sidebar-accent: rgba(241, 90, 36, 0.15);
    --sidebar-accent-foreground: rgba(255, 255, 255, 0.95);
    --sidebar-border: rgba(84, 84, 142, 0.2);
    --sidebar-ring: rgba(241, 90, 36, 0.4);
}

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

/* Floating particle animation */
@keyframes particle-float {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
  33% { transform: translateY(-15px) translateX(4px); opacity: 0.7; }
  66% { transform: translateY(-8px) translateX(-3px); opacity: 0.5; }
}

/* Ember glow pulse */
@keyframes ember-glow {
  0%, 100% { box-shadow: 0 0 6px rgba(241, 90, 36, 0.2); }
  50% { box-shadow: 0 0 14px rgba(241, 90, 36, 0.45); }
}

/* Message appear animation */
@keyframes message-appear {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Channel join animation — updated for APC colors */
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

.animate-ember-glow {
  animation: ember-glow 2s ease-in-out infinite;
}

.animate-message-appear {
  animation: message-appear 300ms ease-out;
}

/* Particle dot utility */
.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: particle-float 6s ease-in-out infinite;
}

/* Glass panel utility */
.glass-panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd bmad/app && npm run build`
Expected: Build succeeds with no errors. The app may look broken visually at this stage (expected — we're changing the color system but haven't updated components yet).

- [ ] **Step 4: Commit**

```bash
git add bmad/app/index.html bmad/app/src/index.css
git commit -m "feat: replace color system with APC-aligned Enchanted Workshop theme

New dark-mode-first color tokens, Merriweather serif font,
CSS animations for particles, ember glow, and message transitions."
```

---

### Task 2: UI Primitives — Button, Card, Input, Textarea, Badge, Label

**Files:**
- Modify: `bmad/app/src/components/ui/button.tsx`
- Modify: `bmad/app/src/components/ui/card.tsx`
- Modify: `bmad/app/src/components/ui/input.tsx`
- Modify: `bmad/app/src/components/ui/textarea.tsx`
- Modify: `bmad/app/src/components/ui/badge.tsx`
- Modify: `bmad/app/src/components/ui/label.tsx`

- [ ] **Step 1: Update button.tsx — orange gradient default variant**

Replace the `buttonVariants` definition in `bmad/app/src/components/ui/button.tsx`:

```tsx
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#f15a24] to-[#ff7849] text-white shadow-[0_2px_8px_rgba(241,90,36,0.25)] hover:shadow-[0_4px_16px_rgba(241,90,36,0.35)] hover:brightness-110",
        outline:
          "border-border bg-transparent hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

- [ ] **Step 2: Update card.tsx — glass-morphism treatment**

Replace the Card component className in `bmad/app/src/components/ui/card.tsx`:

```tsx
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground border border-border has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}
```

Also update CardFooter — replace `bg-muted/50` with glass background:

```tsx
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t border-border bg-muted/30 p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Update input.tsx — dark glass input styling**

Replace the Input className in `bmad/app/src/components/ui/input.tsx`:

```tsx
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-input/50 px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 4: Update textarea.tsx — dark glass textarea styling**

Replace the Textarea className in `bmad/app/src/components/ui/textarea.tsx`:

```tsx
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-input/50 px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 5: Update badge.tsx — ember glow for default**

In `bmad/app/src/components/ui/badge.tsx`, update the `default` variant in `badgeVariants`:

```tsx
default: "bg-primary text-primary-foreground animate-ember-glow [a]:hover:bg-primary/80",
```

- [ ] **Step 6: Update label.tsx — muted foreground color**

No change needed — label already uses `font-medium` and will inherit the new token colors.

- [ ] **Step 7: Verify build compiles**

Run: `cd bmad/app && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add bmad/app/src/components/ui/button.tsx bmad/app/src/components/ui/card.tsx bmad/app/src/components/ui/input.tsx bmad/app/src/components/ui/textarea.tsx bmad/app/src/components/ui/badge.tsx
git commit -m "feat: update UI primitives for Enchanted Workshop theme

Orange gradient buttons, glass-morphism cards, dark glass inputs,
ember glow badges."
```

---

### Task 3: UI Primitives — Dialog, AlertDialog, Sheet, Avatar, Tooltip, ScrollArea, Separator, Tabs

**Files:**
- Modify: `bmad/app/src/components/ui/dialog.tsx`
- Modify: `bmad/app/src/components/ui/alert-dialog.tsx`
- Modify: `bmad/app/src/components/ui/sheet.tsx`
- Modify: `bmad/app/src/components/ui/avatar.tsx`
- Modify: `bmad/app/src/components/ui/tooltip.tsx`
- Modify: `bmad/app/src/components/ui/scroll-area.tsx`
- Modify: `bmad/app/src/components/ui/tabs.tsx`

- [ ] **Step 1: Update dialog.tsx — glass-morphism dialog**

In `bmad/app/src/components/ui/dialog.tsx`, update `DialogOverlay` backdrop:

Replace `bg-black/10` with `bg-black/40 backdrop-blur-sm` in the DialogOverlay className.

Update `DialogContent` (the `DialogPrimitive.Popup` className) — replace:
```
bg-background p-4 text-sm ring-1 ring-foreground/10
```
with:
```
bg-popover p-4 text-sm border border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]
```

Update `DialogFooter` — replace `bg-muted/50` with `bg-muted/30`.

- [ ] **Step 2: Update alert-dialog.tsx — matching glass style**

In `bmad/app/src/components/ui/alert-dialog.tsx`, apply the same changes:

In `AlertDialogContent`, replace `bg-black/10` with `bg-black/40 backdrop-blur-sm` in the Backdrop className.

In the Popup className, replace:
```
bg-background p-4 text-sm ring-1 ring-foreground/10
```
with:
```
bg-popover p-4 text-sm border border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]
```

Update `AlertDialogFooter` — replace `bg-muted/50` with `bg-muted/30`.

- [ ] **Step 3: Update sheet.tsx — enchanted sidebar drawer**

In `bmad/app/src/components/ui/sheet.tsx`, update the Backdrop:

Replace `bg-black/30` with `bg-black/50 backdrop-blur-sm`.

The SheetContent Popup already uses `bg-sidebar text-sidebar-foreground` which is correct — the new sidebar tokens will handle the dark navy look.

- [ ] **Step 4: Update avatar.tsx — gradient ring**

In `bmad/app/src/components/ui/avatar.tsx`, update the `Avatar` component className — replace the `after:border after:border-border after:mix-blend-darken` part with a gradient ring:

Replace:
```
after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten
```
with:
```
ring-2 ring-secondary data-[size=lg]:size-10 data-[size=sm]:size-6
```

Update `AvatarFallback` — replace `bg-muted text-sm text-muted-foreground` with:
```
bg-secondary text-sm text-secondary-foreground
```

- [ ] **Step 5: Update tooltip.tsx — purple background**

In `bmad/app/src/components/ui/tooltip.tsx`, in the `TooltipContent` Popup className, replace `bg-foreground` (appears twice — popup bg and arrow bg/fill) with `bg-secondary`. Replace `text-background` with `text-white`.

Also update the Arrow: replace `bg-foreground fill-foreground` with `bg-secondary fill-secondary`.

- [ ] **Step 6: Update scroll-area.tsx — subtle thumb**

In `bmad/app/src/components/ui/scroll-area.tsx`, in the `ScrollAreaPrimitive.Thumb` className, replace `bg-border` with `bg-secondary/30`.

- [ ] **Step 7: Update tabs.tsx — orange active state**

In `bmad/app/src/components/ui/tabs.tsx`, in `TabsTrigger`, replace the `after:bg-foreground` (the active underline) with `after:bg-primary`. This makes the active tab indicator orange.

- [ ] **Step 8: Verify build compiles**

Run: `cd bmad/app && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add bmad/app/src/components/ui/dialog.tsx bmad/app/src/components/ui/alert-dialog.tsx bmad/app/src/components/ui/sheet.tsx bmad/app/src/components/ui/avatar.tsx bmad/app/src/components/ui/tooltip.tsx bmad/app/src/components/ui/scroll-area.tsx bmad/app/src/components/ui/tabs.tsx
git commit -m "feat: update remaining UI primitives for dark glass theme

Glass-morphism dialogs, gradient avatar rings, purple tooltips,
orange tab indicators, enchanted sheet drawer."
```

---

### Task 4: Auth Pages — Split Hero Login, Signup, ForgotPassword

**Files:**
- Modify: `bmad/app/src/features/auth/LoginPage.tsx`
- Modify: `bmad/app/src/features/auth/SignupPage.tsx`
- Modify: `bmad/app/src/features/auth/ForgotPasswordPage.tsx`

- [ ] **Step 1: Rewrite LoginPage.tsx with split hero layout**

Replace the entire return JSX of `LoginPage` in `bmad/app/src/features/auth/LoginPage.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { handleSupabaseError } from '@/lib/errors'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(handleSupabaseError(signInError))
      setLoading(false)
    } else {
      navigate('/channels')
    }
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Left panel — brand showcase */}
      <div className="hidden md:flex flex-1 flex-col justify-center px-12 lg:px-20 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(241,90,36,0.12)_0%,transparent_70%)]" />
        {/* Constellation dots */}
        <div className="particle w-[3px] h-[3px] bg-primary/50 shadow-[0_0_6px_rgba(241,90,36,0.4)] top-[15%] left-[20%]" style={{ animationDelay: '0s' }} />
        <div className="particle w-[2px] h-[2px] bg-accent/40 shadow-[0_0_6px_rgba(45,163,203,0.3)] top-[60%] right-[25%]" style={{ animationDelay: '2s' }} />
        <div className="particle w-[2px] h-[2px] bg-secondary/50 shadow-[0_0_5px_rgba(84,84,142,0.4)] bottom-[20%] left-[35%]" style={{ animationDelay: '4s' }} />

        <div className="relative z-10">
          <h1 className="font-heading text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-3">
            Magic<br />Brooms
          </h1>
          <p className="text-accent text-sm tracking-[0.15em] uppercase">
            A Portland Career&apos;s Workshop
          </p>
          <div className="mt-4 w-10 h-0.5 bg-gradient-to-r from-primary to-transparent" />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 md:flex-none md:w-[420px] flex-col justify-center border-l border-border bg-card/50 px-8 md:px-12">
        {/* Mobile brand (hidden on desktop) */}
        <div className="md:hidden text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Magic Brooms</h1>
          <p className="text-accent text-xs tracking-[0.15em] uppercase mt-1">The Workshop</p>
        </div>

        <h2 className="text-lg font-medium text-foreground mb-6">Enter the Workshop</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="apprentice@workshop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your incantation"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Opening the doors...' : 'Enter the Workshop'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm text-center">
          <Link to="/signup" className="text-accent hover:text-accent/80">
            New apprentice? Sign up
          </Link>
          <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">
            Forgot your incantation?
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite SignupPage.tsx with split hero layout**

Replace the entire file `bmad/app/src/features/auth/SignupPage.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { handleSupabaseError } from '@/lib/errors'

export function SignupPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signUpError } = await signUp(email, password, displayName || undefined)

    if (signUpError) {
      setError(handleSupabaseError(signUpError))
      setLoading(false)
      return
    }

    if (data?.session) {
      navigate('/channels')
    } else {
      setConfirmationSent(true)
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <div className="glass-panel max-w-md p-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Scroll Dispatched</h2>
          <p className="text-muted-foreground text-sm mb-6">
            A confirmation scroll has been sent to your email. Open it to complete your apprenticeship.
          </p>
          <Link to="/login" className="text-sm text-accent hover:text-accent/80">
            Return to the workshop entrance
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Left panel — brand showcase */}
      <div className="hidden md:flex flex-1 flex-col justify-center px-12 lg:px-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(241,90,36,0.12)_0%,transparent_70%)]" />
        <div className="particle w-[3px] h-[3px] bg-primary/50 shadow-[0_0_6px_rgba(241,90,36,0.4)] top-[20%] left-[25%]" style={{ animationDelay: '1s' }} />
        <div className="particle w-[2px] h-[2px] bg-accent/40 shadow-[0_0_6px_rgba(45,163,203,0.3)] top-[55%] right-[20%]" style={{ animationDelay: '3s' }} />

        <div className="relative z-10">
          <h1 className="font-heading text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-3">
            Magic<br />Brooms
          </h1>
          <p className="text-accent text-sm tracking-[0.15em] uppercase">
            A Portland Career&apos;s Workshop
          </p>
          <div className="mt-4 w-10 h-0.5 bg-gradient-to-r from-primary to-transparent" />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 md:flex-none md:w-[420px] flex-col justify-center border-l border-border bg-card/50 px-8 md:px-12">
        <div className="md:hidden text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Magic Brooms</h1>
          <p className="text-accent text-xs tracking-[0.15em] uppercase mt-1">The Workshop</p>
        </div>

        <h2 className="text-lg font-medium text-foreground mb-6">Begin Your Apprenticeship</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="What shall we call you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="apprentice@workshop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Inscribing your name...' : 'Join the Workshop'}
          </Button>
        </form>

        <div className="mt-6 text-sm text-center">
          <Link to="/login" className="text-accent hover:text-accent/80">
            Already an apprentice? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite ForgotPasswordPage.tsx with split hero layout**

Replace the entire file `bmad/app/src/features/auth/ForgotPasswordPage.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { handleSupabaseError } from '@/lib/errors'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await resetPassword(email)

    if (resetError) {
      setError(handleSupabaseError(resetError))
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <div className="glass-panel max-w-md p-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Recovery Scroll Sent</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Check your email for a link to reset your incantation. The magic may take a moment to arrive.
          </p>
          <Link to="/login" className="text-sm text-accent hover:text-accent/80">
            Return to the workshop entrance
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Left panel */}
      <div className="hidden md:flex flex-1 flex-col justify-center px-12 lg:px-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(241,90,36,0.12)_0%,transparent_70%)]" />
        <div className="particle w-[3px] h-[3px] bg-primary/50 shadow-[0_0_6px_rgba(241,90,36,0.4)] top-[25%] left-[30%]" style={{ animationDelay: '0.5s' }} />
        <div className="particle w-[2px] h-[2px] bg-accent/40 shadow-[0_0_6px_rgba(45,163,203,0.3)] bottom-[30%] right-[20%]" style={{ animationDelay: '3.5s' }} />

        <div className="relative z-10">
          <h1 className="font-heading text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-3">
            Magic<br />Brooms
          </h1>
          <p className="text-accent text-sm tracking-[0.15em] uppercase">
            A Portland Career&apos;s Workshop
          </p>
          <div className="mt-4 w-10 h-0.5 bg-gradient-to-r from-primary to-transparent" />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 md:flex-none md:w-[420px] flex-col justify-center border-l border-border bg-card/50 px-8 md:px-12">
        <div className="md:hidden text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Magic Brooms</h1>
          <p className="text-accent text-xs tracking-[0.15em] uppercase mt-1">The Workshop</p>
        </div>

        <h2 className="text-lg font-medium text-foreground mb-2">Recovery Scroll</h2>
        <p className="text-sm text-muted-foreground mb-6">Enter your email and we&apos;ll send a recovery scroll.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="apprentice@workshop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Preparing the scroll...' : 'Send Recovery Scroll'}
          </Button>
        </form>

        <div className="mt-6 text-sm text-center">
          <Link to="/login" className="text-accent hover:text-accent/80">
            Back to the workshop entrance
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build compiles**

Run: `cd bmad/app && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add bmad/app/src/features/auth/
git commit -m "feat: redesign auth pages with split hero layout

Constellation particles, ambient orange glow, glass form panel,
APC brand attribution, responsive mobile fallback."
```

---

### Task 5: Sidebar — Enchanted Tome with Particles

**Files:**
- Modify: `bmad/app/src/components/shared/AppLayout.tsx`

- [ ] **Step 1: Update SidebarContent with enchanted styling**

In `bmad/app/src/components/shared/AppLayout.tsx`, update the SidebarContent function's return JSX. Replace the entire return block (`<>...</>`) of `SidebarContent`:

```tsx
return (
  <>
    {/* Floating particles */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="particle w-[3px] h-[3px] bg-accent/40 shadow-[0_0_6px_rgba(45,163,203,0.3)] top-[15%] right-[12%]" style={{ animationDelay: '0s', animationDuration: '7s' }} />
      <div className="particle w-[2px] h-[2px] bg-primary/30 shadow-[0_0_4px_rgba(241,90,36,0.3)] top-[45%] right-[25%]" style={{ animationDelay: '2.5s', animationDuration: '5s' }} />
      <div className="particle w-[2px] h-[2px] bg-secondary/40 shadow-[0_0_5px_rgba(84,84,142,0.4)] top-[75%] right-[8%]" style={{ animationDelay: '4s', animationDuration: '8s' }} />
    </div>

    {/* Header */}
    <div className="relative z-10 p-4">
      <h1 className="font-heading text-lg font-bold bg-gradient-to-r from-primary to-[#ff7849] bg-clip-text text-transparent">
        Magic Brooms
      </h1>
      <p className="text-[10px] text-accent/50 tracking-[0.2em] uppercase">The Workshop</p>
    </div>

    {/* Search */}
    <div className="relative z-10 px-3 pb-3">
      <Input
        placeholder="Search the workshop..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          setShowSearch(e.target.value.length > 0)
        }}
        className="bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 h-8 text-sm"
      />
    </div>

    {/* Search results overlay */}
    {showSearch && searchResults && searchResults.length > 0 && (
      <div className="relative z-50 border-b border-sidebar-border bg-sidebar p-2">
        <ScrollArea className="max-h-60">
          {searchResults.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => onSearchResultClick(r)}
              className="w-full rounded-lg p-2 text-left text-sm hover:bg-sidebar-accent/50 transition-colors"
            >
              <span className="text-xs text-sidebar-foreground/40">
                {r.type === 'card' ? 'Card' : 'Message'} in #{r.channelName}
              </span>
              <p className="truncate text-sidebar-foreground">
                {r.title ?? r.content.slice(0, 80)}
              </p>
            </button>
          ))}
        </ScrollArea>
      </div>
    )}

    {/* Channels */}
    <ScrollArea className="relative z-10 flex-1">
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent/50">
            Channels
          </span>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-accent/60 hover:text-accent" onClick={onCreateChannel}>
            +
          </Button>
        </div>

        {channels
          ?.filter((c) => !c.isArchived)
          .map((ch) => {
            const isMember = memberChannelIds.has(ch.id)
            const badgeCount = ch.type === 'gallery'
              ? (galleryCardCounts?.get(ch.id) ?? 0)
              : (unreadCounts?.get(ch.id) ?? 0)
            const isActive = channelId === ch.id
            const justJoined = recentlyJoined.has(ch.id)

            return (
              <div key={ch.id} className={`flex items-center gap-1 ${justJoined ? 'animate-channel-join' : ''}`}>
                {isMember ? (
                  <Link
                    to={`/channels/${ch.id}`}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent border-l-[3px] border-l-primary text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/30'
                    } ${badgeCount > 0 ? 'font-bold' : ''}`}
                  >
                    <span className="text-sidebar-foreground/30 mr-1">
                      {ch.type === 'gallery' ? '\u{1F5BC}' : '#'}
                    </span>
                    {ch.name}
                    {badgeCount > 0 && (
                      <Badge className="ml-1 h-4 min-w-4 justify-center px-1 text-[10px]">
                        {badgeCount}
                      </Badge>
                    )}
                  </Link>
                ) : (
                  <button
                    onClick={() => onJoinChannel(ch.id)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-left text-sm text-sidebar-foreground/30 hover:text-sidebar-foreground/50 italic transition-colors"
                  >
                    <span className="mr-1">{ch.type === 'gallery' ? '\u{1F5BC}' : '#'}</span>
                    {ch.name}
                    <span className="ml-1 text-[10px]">(join)</span>
                  </button>
                )}
              </div>
            )
          })}
      </div>
    </ScrollArea>

    {/* User section */}
    <div className="relative z-10 border-t border-sidebar-border p-3">
      <div className="flex items-center justify-between">
        <Link to="/profile" className="flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent text-[10px] text-white">
            {(profile?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <span>{profile?.displayName ?? user?.email ?? 'Apprentice'}</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="h-6 text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground"
        >
          Logout
        </Button>
      </div>
    </div>
  </>
)
```

- [ ] **Step 2: Update the desktop sidebar container**

In the `AppLayout` return, update the desktop sidebar `<aside>` — add `relative` for particle positioning and gradient background:

Replace:
```tsx
<aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
```
with:
```tsx
<aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-gradient-to-b from-[#16163f] to-[#0a0a25] text-sidebar-foreground relative">
```

- [ ] **Step 3: Update the mobile header**

In the AppLayout return, update the mobile header div:

Replace:
```tsx
<div className="flex md:hidden items-center gap-3 border-b px-3 py-2 bg-background">
```
with:
```tsx
<div className="flex md:hidden items-center gap-3 border-b border-border px-3 py-2 bg-[#12122e]">
```

Update the profile initials link — replace:
```tsx
<Link to="/profile" className="text-sm text-muted-foreground">
  {profile?.displayName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
</Link>
```
with:
```tsx
<Link to="/profile" className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent text-xs text-white">
  {profile?.displayName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
</Link>
```

- [ ] **Step 4: Remove the Separator import (no longer used in sidebar)**

Remove `Separator` from the imports since we replaced the separators with border-t:

```tsx
import { Separator } from '@/components/ui/separator'
```

If `Separator` is still used elsewhere in the file (check first), keep the import. If only used in SidebarContent, remove it.

- [ ] **Step 5: Verify build compiles**

Run: `cd bmad/app && npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add bmad/app/src/components/shared/AppLayout.tsx
git commit -m "feat: redesign sidebar as Enchanted Tome

Floating particles, gradient brand name, ember glow badges,
gradient avatar ring, navy gradient background, 'The Workshop' subtitle."
```

---

### Task 6: ChatView — Glass Panel Messages

**Files:**
- Modify: `bmad/app/src/features/channels/ChatView.tsx`

- [ ] **Step 1: Update MessageReactions styling**

In `bmad/app/src/features/channels/ChatView.tsx`, in the `MessageReactions` component, update the reaction button classNames:

Replace the user-reacted ternary:
```tsx
className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
  r.userReacted
    ? 'border-primary/50 bg-primary/10'
    : 'border-border bg-muted/50 hover:bg-muted'
}`}
```
with:
```tsx
className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
  r.userReacted
    ? 'border-primary/50 bg-primary/15 shadow-[0_0_6px_rgba(241,90,36,0.1)]'
    : 'border-border bg-muted/30 hover:bg-muted/50'
}`}
```

Update the "+" add reaction button:
```tsx
className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted/50"
```

Update the emoji picker popup:
```tsx
className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border border-border bg-popover p-1 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
```

- [ ] **Step 2: Update MessageItem — glass panel cards**

In the `MessageItem` component, update the root div className:

Replace:
```tsx
className="group relative flex gap-3 px-4 py-2 hover:bg-muted/30"
```
with:
```tsx
className="group relative flex gap-3 px-4 py-2"
```

Wrap the message content in a glass panel. After the `<Avatar>` component, update the content wrapper:

Replace:
```tsx
<div className="min-w-0 flex-1">
```
with:
```tsx
<div className="min-w-0 flex-1 rounded-xl bg-card border border-border p-3">
```

Update the floating toolbar:
```tsx
className={`absolute -top-3 right-4 flex items-center gap-0.5 rounded-md border border-border bg-popover px-1 py-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-opacity ${
  showMobileToolbar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
}`}
```

- [ ] **Step 3: Update ChatView — channel header and message input**

In the `ChatView` component, update the channel header:

Replace:
```tsx
<div className="hidden md:flex items-center gap-3 border-b px-4 py-3">
  <div>
    <h2 className="text-lg font-semibold">#{channel?.name}</h2>
```
with:
```tsx
<div className="hidden md:flex items-center gap-3 border-b border-border px-4 py-3">
  <div>
    <h2 className="font-heading text-lg font-bold">#{channel?.name}</h2>
```

Update the message input area border:

Replace:
```tsx
<div className="border-t p-4">
```
with:
```tsx
<div className="border-t border-border p-4">
```

Update the Send button with orange glow on hover:
```tsx
<Button
  type="submit"
  size="sm"
  disabled={!content.trim() || sendMessage.isPending}
  className="self-end"
>
  Send
</Button>
```

- [ ] **Step 4: Verify build compiles**

Run: `cd bmad/app && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add bmad/app/src/features/channels/ChatView.tsx
git commit -m "feat: redesign chat view with glass panel messages

Translucent message cards, ember-glow reactions, glass emoji picker,
serif channel header, dark themed toolbar."
```

---

### Task 7: Gallery View and Card Detail

**Files:**
- Modify: `bmad/app/src/features/gallery/GalleryView.tsx`
- Modify: `bmad/app/src/features/gallery/GalleryCardDetail.tsx`

- [ ] **Step 1: Update GalleryView**

In `bmad/app/src/features/gallery/GalleryView.tsx`:

Update the header — replace:
```tsx
<div className="flex items-center justify-between border-b px-4 py-3">
  <div className="hidden md:block">
    <h2 className="text-lg font-semibold">#{channel?.name}</h2>
```
with:
```tsx
<div className="flex items-center justify-between border-b border-border px-4 py-3">
  <div className="hidden md:block">
    <h2 className="font-heading text-lg font-bold">#{channel?.name}</h2>
```

Update the grid gap:
```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
```

Update each Card with hover glow — replace:
```tsx
className="cursor-pointer transition-shadow hover:shadow-md"
```
with:
```tsx
className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-[0_0_20px_rgba(241,90,36,0.1)]"
```

Add stagger animation to cards with `style` on each card:
```tsx
{cards?.map((card, i) => (
  <Card
    key={card.id}
    className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-[0_0_20px_rgba(241,90,36,0.1)] animate-message-appear"
    style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
    onClick={() => navigate(`/channels/${channelId}/card/${card.id}`)}
  >
```

- [ ] **Step 2: Update GalleryCardDetail**

In `bmad/app/src/features/gallery/GalleryCardDetail.tsx`:

Update the back link:
```tsx
className="mb-4 inline-block text-sm text-accent hover:text-accent/80"
```

Update the title to serif:
```tsx
<h1 className="mb-2 font-heading text-2xl font-bold">{card.title}</h1>
```

Update the external link:
```tsx
className="mb-4 inline-block text-sm text-accent underline hover:text-accent/80"
```

Update reactions — same styling as ChatView reactions (replace `border-primary/50 bg-primary/10` with `border-primary/50 bg-primary/15 shadow-[0_0_6px_rgba(241,90,36,0.1)]` and `border-border bg-muted/50 hover:bg-muted` with `border-border bg-muted/30 hover:bg-muted/50`).

Update the emoji picker popup:
```tsx
className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border border-border bg-popover p-2 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
```

Update comments heading:
```tsx
<h2 className="mb-4 font-heading text-lg font-bold">Comments</h2>
```

- [ ] **Step 3: Verify build compiles**

Run: `cd bmad/app && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add bmad/app/src/features/gallery/
git commit -m "feat: redesign gallery with glass cards and staggered animations

Orange hover glow, staggered fade-in, teal links, serif headings,
ember-glow reactions, dark glass card detail."
```

---

### Task 8: Profile Page

**Files:**
- Modify: `bmad/app/src/features/profile/ProfilePage.tsx`

- [ ] **Step 1: Update ProfilePage styling**

In `bmad/app/src/features/profile/ProfilePage.tsx`:

Update the Avatar to use gradient ring — replace:
```tsx
<Avatar className="h-20 w-20">
```
with:
```tsx
<Avatar className="h-20 w-20 ring-[3px] ring-gradient-to-br from-secondary to-accent">
```

Note: Since Tailwind can't do gradient rings directly, instead update the avatar wrapper button to add a gradient ring effect:

Replace:
```tsx
className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
```
with:
```tsx
className="group relative rounded-full p-[3px] bg-gradient-to-br from-[#54548E] to-[#2DA3CB] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
```

Update the CardTitle:
```tsx
<CardTitle className="font-heading text-2xl">Your Profile</CardTitle>
```

Update role display — replace:
```tsx
<p className="text-sm capitalize">{profile?.role ?? 'student'}</p>
```
with:
```tsx
<p className="text-sm capitalize text-accent">{profile?.role ?? 'student'}</p>
```

Update the "Remove photo" link:
```tsx
className="text-xs text-muted-foreground hover:text-destructive transition-colors"
```

Update "Back to channels" link:
```tsx
className="text-sm text-accent hover:text-accent/80"
```

- [ ] **Step 2: Verify build compiles**

Run: `cd bmad/app && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add bmad/app/src/features/profile/ProfilePage.tsx
git commit -m "feat: redesign profile page with gradient avatar ring

Purple-to-teal gradient avatar border, teal role display,
serif heading, glass card styling."
```

---

### Task 9: Welcome Page and App-level Polish

**Files:**
- Modify: `bmad/app/src/App.tsx`

- [ ] **Step 1: Update the welcome/landing page**

In `bmad/app/src/App.tsx`, update the default route's inline content:

Replace:
```tsx
<div className="flex h-full items-center justify-center text-muted-foreground">
  <div className="text-center space-y-2">
    <p className="text-2xl">Welcome to the workshop</p>
    <p className="text-sm">Select a channel to begin</p>
  </div>
</div>
```
with:
```tsx
<div className="flex h-full items-center justify-center text-muted-foreground">
  <div className="text-center space-y-3">
    <p className="font-heading text-3xl text-foreground">Welcome to the Workshop</p>
    <p className="text-sm">Select a channel to begin your apprenticeship</p>
    <div className="mx-auto mt-2 w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
  </div>
</div>
```

- [ ] **Step 2: Verify full build compiles**

Run: `cd bmad/app && npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 3: Commit**

```bash
git add bmad/app/src/App.tsx
git commit -m "feat: update welcome page with enchanted workshop styling"
```

---

### Task 10: Visual QA and Final Verification

- [ ] **Step 1: Start dev server and verify all pages**

Run: `cd bmad/app && npm run dev`

Verify these pages work:
- `/login` — Split hero layout, particles, orange CTA
- `/signup` — Split hero layout, matching style
- `/forgot-password` — Split hero layout, matching style
- `/channels/:id` — Dark background, glass panel messages, ember reactions
- Gallery channels — Glass cards with stagger animation, orange hover glow
- Gallery card detail — Teal links, serif headings, glass comments
- `/profile` — Gradient avatar ring, glass card, teal role
- Mobile responsive — Drawer sidebar, stacked auth pages

- [ ] **Step 2: Verify build succeeds clean**

Run: `cd bmad/app && npm run build`
Expected: Zero errors, zero warnings about missing types.

- [ ] **Step 3: Final commit if any fixes were needed**

Only if fixes were applied in this step:
```bash
git add -A bmad/app/src/
git commit -m "fix: visual QA polish and fixes"
```
