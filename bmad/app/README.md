# Magic Brooms — App

The production chat app for [A Portland Career](https://aportlandcareer.com/)'s AI-Assisted Software Development course.

**Live at** [magic-brooms.vercel.app](https://magic-brooms.vercel.app)

## Features

- Real-time messaging with inline editing and (edited) indicators
- Channels (standard + gallery types) with one-click join
- Auto-join default channels on first login
- Profile image upload with client-side resize, and remove
- Emoji reactions on messages and gallery cards
- Gallery showcases with cards, comments, and image uploads
- Full-text search across messages and cards
- Instructor/student roles with moderation tools
- Floating toolbar with edit/delete actions on hover
- Unread badges (realtime, no polling)
- Sorcerer's Apprentice theme

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
npm run dev                   # http://localhost:5173
```

For local Supabase (recommended for development):

```bash
npx supabase start
# use the local URL + anon key from the output in .env.local
npm run dev
npx supabase stop             # when done
```

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## Project Structure

```
src/
├── features/         # Feature modules
│   ├── auth/         # Login, signup, forgot password
│   ├── channels/     # Channel list, chat view, message editing
│   ├── gallery/      # Gallery cards, comments, image upload
│   └── profile/      # Profile editing, avatar upload/remove
├── hooks/            # Data hooks (useMessages, useChannels, useProfile, etc.)
├── components/       # Shared UI components
│   ├── ui/           # Base components (Button, Input, Card, Avatar...)
│   └── shared/       # App layout, protected routes
├── stores/           # Zustand state stores
└── lib/              # Supabase client, utilities
```

## Database

10 migrations in `supabase/migrations/`. To apply to a fresh Supabase project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Tables: profiles, channels, channel_members, messages, gallery_cards, card_comments, reactions. Storage bucket: avatars.

## Deployment

Vercel project `team-town/magic-brooms` with root directory `bmad/app/`. Env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel dashboard.

The intended flow is **push to `main` → auto-deploy** via Vercel's GitHub integration, but that integration has been broken since ~2026-04-07 (see `../../devlog/bmad-010-meet-chat-backfill.md`). Until it's reconnected, push to main and then run `npx vercel --prod --yes` from this directory **exactly once**. Don't double-deploy. Verify with `vercel ls`.
