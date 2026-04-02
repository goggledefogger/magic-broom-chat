# Magic Brooms — App

The production chat application. Built with the BMAD Method using React 19, TypeScript, and Supabase.

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
npm run dev                   # http://localhost:5173
```

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── features/         # Feature modules
│   ├── auth/         # Login, signup, forgot password
│   ├── channels/     # Channel list, messages, composer
│   ├── gallery/      # Gallery cards + comments
│   └── profile/      # User profile editing
├── hooks/            # Data hooks (useMessages, useChannels, useAuth, etc.)
├── components/       # Shared UI components
│   ├── ui/           # Base components (Button, Input, Card, Avatar...)
│   └── shared/       # App-level shared components
├── stores/           # Zustand state stores
├── lib/              # Supabase client, error handling, utilities
└── test/             # Test setup
```

## Database

Migrations live in `supabase/migrations/`. To apply them to a fresh Supabase project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

## Deployment

Deployed to Vercel with root directory set to `bmad/app/`. Environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured in the Vercel dashboard.
