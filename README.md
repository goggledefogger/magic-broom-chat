# Magic Broom Chat

A real-time team chat app built with AI-assisted development, used as the hands-on project for Portland Career's AI-Assisted Software Development course.

**Live app:** [magic-brooms.vercel.app](https://magic-brooms.vercel.app)

## The App

Magic Broom Chat is a Slack/Zulip-inspired chat application with:

- Real-time messaging across channels
- User authentication (email/password, password reset)
- Channel creation and browsing (standard + gallery types)
- Emoji reactions and message deletion
- Gallery cards with comments
- User profiles with display name editing
- Instructor/student roles
- Full-text search across messages
- Sorcerer's Apprentice theme throughout

**Tech stack:** React 19 + TypeScript + Vite + Tailwind CSS + Supabase (auth, database, realtime) + Vercel

## Getting Started

The production app lives in `bmad/app/`. To run it locally:

```bash
cd bmad/app
npm install
cp .env.example .env.local   # then fill in your Supabase credentials
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and you're in.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

Ask your instructor for the shared Supabase credentials, or create your own project and apply the migrations in `bmad/app/supabase/migrations/`.

## Deployment

The app uses three environments. **Never develop against production.**

| Environment | Database | Frontend | Purpose |
|-------------|----------|----------|---------|
| **Local dev** | Docker (`supabase start`) | `localhost:5173` | Day-to-day development |
| **Your fork** | Your own Supabase project | Your own Vercel URL | Testing deployments |
| **Production** | Instructor's Supabase | [magic-brooms.vercel.app](https://magic-brooms.vercel.app) | Live app for students |

### Local development (recommended)

Supabase runs entirely on your machine via Docker — your own database, auth, and realtime:

```bash
cd bmad/app
npx supabase start          # starts local Supabase (first run downloads Docker images)
cp .env.example .env.local  # then set the local URL and anon key from the output
npm run dev
```

The migrations in `supabase/migrations/` are applied automatically. Local auth accepts any email — check [Mailpit](http://localhost:54324) for confirmation emails.

```bash
npx supabase stop           # when done (preserves data)
```

### Deploying your own fork

To test in a production-like environment with your own infrastructure:

**Supabase (backend):**
1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Apply the schema:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
3. Copy your URL and anon key from **Settings > API**

**Vercel (frontend):**
1. Import your fork at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `bmad/app`
3. Add env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from your Supabase project)
4. Deploy — you get a unique URL like `your-fork.vercel.app`
5. Add your Vercel URL to Supabase **Authentication > URL Configuration** as the Site URL

Every push to your fork creates an automatic preview deployment on Vercel.

## Contributing

We welcome contributions! This is a great way to practice a real-world GitHub workflow. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, but the short version:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes in `bmad/app/`
4. Test locally (`npm run dev`, `npm run build`)
5. Commit with a clear message
6. Open a Pull Request

### Side Quest: Open Source Contribution

Contributing to this repo counts as the **open source contribution side quest**. Good first issues are labeled [`good first issue`](../../labels/good%20first%20issue) on GitHub. Ideas for contributions:

- UI improvements and polish
- New emoji reactions
- Dark mode
- Message threading
- Mobile responsiveness fixes
- Accessibility improvements
- Test coverage

## Project Structure

```
magic-broom-chat/
├── bmad/app/          # The production app (BMAD Method)
│   ├── src/
│   │   ├── features/  # Auth, channels, gallery, profile
│   │   ├── hooks/     # React hooks (useMessages, useChannels, etc.)
│   │   ├── components/# Shared UI components
│   │   ├── stores/    # Zustand state management
│   │   └── lib/       # Supabase client, utilities
│   └── supabase/      # Database migrations
├── devlog/            # Development journal across all experiments
├── CONTRIBUTING.md    # How to contribute
└── KICKOFF_PROMPT.md  # Original project brief
```

## Background: How We Got Here

This app was built as a framework comparison experiment. We built the same chat app five different ways using different AI-assisted development frameworks, then chose the best one to ship:

| Framework | Approach | Outcome |
|-----------|----------|---------|
| **BMAD Method** | Agent-based agile, specialized personas | **Winner** — best scaffolding, most features, production-ready |
| Compound Engineering | Schema-first, 80/20 planning | Best process workflow, used for teaching |
| Superpowers | TDD-first, sequential phases | Most tests, highest token cost |
| Vanilla Claude Code | No framework, direct AI coding | Fastest to prototype |
| gstack | Design-first, virtual team | Best visual polish |

We chose **BMAD** because it produced the most complete, well-structured application:
- Full auth flow including password reset
- Profile management (edit display name, view role)
- Gallery channels with cards and comments
- Emoji reactions
- Instructor/student role system
- 9 versioned database migrations
- TanStack Query for data management
- Zustand for state

The other versions remain in the repo as educational artifacts. See `devlog/` for the full comparison journey, or open `devlog/framework-comparison-report.html` for a visual report.

## License

[MIT](LICENSE)
