# Contributing to Magic Broom Chat

Thanks for wanting to contribute! This guide will help you get set up and submit your first pull request.

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [Docker Desktop](https://docs.docker.com/desktop/) (for local Supabase)
- A GitHub account
- Git installed locally
- A code editor (VS Code recommended)

## Setup

### 1. Fork and clone

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/magic-broom-chat.git
cd magic-broom-chat
```

### 2. Install dependencies

```bash
cd bmad/app
npm install
```

### 3. Start a local Supabase database

**You should always develop against a local database, never the production one.**

Supabase runs entirely on your machine via Docker. This gives you your own database, auth server, and realtime engine — identical to production but completely isolated.

```bash
# Install the Supabase CLI (if you don't have it)
npm install -g supabase

# Start the local Supabase stack (first run downloads Docker images — takes a few minutes)
npx supabase start
```

When it finishes, you'll see output like:

```
         API URL: http://127.0.0.1:54321
     Studio URL: http://127.0.0.1:54323
        anon key: eyJh......
service_role key: eyJh......
```

The **Studio URL** gives you a local dashboard to browse your database, just like the cloud version.

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with the local values from the output above:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJh......   # paste the anon key from supabase start
```

The migrations in `supabase/migrations/` are automatically applied when you run `supabase start`, so your local database already has the full schema.

### 5. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173). Sign up with any email — the local auth server accepts everything and doesn't actually send emails. Check the local [Mailpit](http://localhost:54324) to see confirmation emails.

### 6. Stop Supabase when you're done

```bash
npx supabase stop        # preserves your local data
npx supabase stop --no-backup  # wipes local data (clean slate)
```

## Local vs Production Database

| | Local | Production |
|---|---|---|
| **URL** | `http://127.0.0.1:54321` | `https://gwcuxnlhgquchuimuxrk.supabase.co` |
| **Where** | Docker on your machine | Supabase cloud |
| **Data** | Your test data only | Real user data |
| **Auth emails** | Caught by local Mailpit | Actually sent |
| **Use for** | Development, testing | Never develop against this |

**Rule: never put production credentials in your `.env.local`.** If you accidentally connect to production and break something, real users are affected.

## Making Database Changes

If your feature needs a schema change (new table, new column, etc.):

```bash
# Create a new migration file
npx supabase migration new your_change_name

# Edit the generated file in supabase/migrations/
# Write your SQL (CREATE TABLE, ALTER TABLE, etc.)

# Apply it to your local database
npx supabase db reset
```

Include the migration file in your PR. It will be reviewed before being applied to production.

## Making Code Changes

### Where to work

All app code lives in `bmad/app/src/`. The main areas:

| Directory | What's there |
|-----------|-------------|
| `features/auth/` | Login, signup, forgot password pages |
| `features/channels/` | Channel list, channel page, message composer |
| `features/gallery/` | Gallery cards and comments |
| `features/profile/` | User profile page |
| `hooks/` | Data fetching hooks (useMessages, useChannels, etc.) |
| `components/ui/` | Reusable UI components (Button, Input, Card, etc.) |
| `stores/` | Zustand state stores |
| `lib/` | Supabase client, error handling, utilities |

### Branch naming

```
feat/short-description    # New features
fix/short-description     # Bug fixes
docs/short-description    # Documentation only
style/short-description   # UI/CSS changes
```

### Before you commit

```bash
npm run build    # Make sure TypeScript compiles
npm run lint     # Check for lint errors
```

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature
   ```

2. **Make your changes** — keep PRs focused on one thing.

3. **Test locally** — run `npm run dev` and verify your changes work. Run `npm run build` to catch type errors.

4. **Commit** with a clear message:
   ```bash
   git add -A
   git commit -m "feat: add dark mode toggle to sidebar"
   ```

5. **Push and open a PR**:
   ```bash
   git push origin feat/your-feature
   ```
   Then open a Pull Request on GitHub against `main`.

6. **Describe your PR** — explain what you changed and why. Include a screenshot if it's a UI change.

## Commit Message Format

Use conventional commits:

```
feat: add channel search filtering
fix: prevent duplicate messages on reconnect
style: improve mobile sidebar layout
docs: update setup instructions
refactor: extract message grouping logic
```

## Code Style

- **TypeScript** — all new code should be typed
- **Tailwind CSS** — use utility classes, avoid custom CSS
- **React hooks** — data fetching goes in `hooks/`, not in components
- **Zustand** — global state goes in `stores/`
- **Keep it simple** — don't over-engineer. If three lines work, don't write an abstraction

## Deploying Your Fork

You can deploy your own copy of the app to test changes in a production-like environment. This is separate from the main production app — you won't break anything.

### Vercel (frontend)

1. Go to [vercel.com/new](https://vercel.com/new) and import **your fork** (not the original repo)
2. Set **Root Directory** to `bmad/app`
3. Framework Preset: **Vite** (auto-detected)
4. Add environment variables:
   - `VITE_SUPABASE_URL` — your own Supabase project URL (not production!)
   - `VITE_SUPABASE_ANON_KEY` — your own Supabase anon key
5. Deploy

Vercel gives you a unique URL like `your-fork-name.vercel.app`. Every push to your fork automatically creates a preview deployment.

**Vercel + GitHub PRs:** When you open a PR against the main repo, Vercel can create a preview deployment for that PR automatically. Ask your instructor if this is enabled.

### Supabase (backend)

For your deployed fork, you need your own Supabase project (free tier works):

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Go to your project's SQL Editor and run each migration file from `bmad/app/supabase/migrations/` in order (00001 through 00009)
3. Or use the CLI:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
4. Copy your project's URL and anon key from **Settings > API** into your Vercel environment variables
5. Set your Vercel URL in **Authentication > URL Configuration** as the Site URL

### Environment Summary

| Environment | Database | Frontend | Who uses it |
|-------------|----------|----------|-------------|
| **Local dev** | Docker (`supabase start`) | `localhost:5173` | You, while coding |
| **Your fork** | Your own Supabase project | Your Vercel URL | You, for testing deploys |
| **Production** | Instructor's Supabase | magic-brooms.vercel.app | Everyone (don't touch!) |

## Need Help?

- Check existing code for patterns to follow
- Look at the `devlog/` for context on past decisions
- Ask in the `#general` channel on the [live app](https://magic-brooms.vercel.app)
- Open a GitHub issue if you're stuck

## Using AI Tools

You're encouraged to use AI tools (Claude Code, Cursor, etc.) to help with your contributions — this is an AI-assisted development course after all! Just make sure you understand the code you're submitting.
