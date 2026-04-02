# Magic Brooms

The chat app for [A Portland Career](https://aportlandcareer.com/)'s AI-Assisted Software Development course. Built with AI, used by students, open for contributions.

**Live at** [magic-brooms.vercel.app](https://magic-brooms.vercel.app)

## What Is This

A Slack-style chat app with real-time messaging, channels, gallery showcases, emoji reactions, full-text search, profile image upload, and instructor tools. Sorcerer's Apprentice themed.

React 19 / TypeScript / Vite / Tailwind / Supabase / Vercel

## Run It Locally

```bash
cd bmad/app
npm install
cp .env.example .env.local   # fill in Supabase creds (ask your instructor)
npm run dev
```

That's it. [localhost:5173](http://localhost:5173). You're in.

For full local Supabase (your own database, no cloud needed):

```bash
npx supabase start            # Docker pulls images on first run
cp .env.example .env.local    # use the local URL + anon key from output
npm run dev
npx supabase stop             # when done
```

## Deploy Your Own

| Environment | Database | Frontend | For |
|-------------|----------|----------|-----|
| **Local** | Docker | localhost:5173 | Development |
| **Your fork** | Your Supabase | Your Vercel | Testing |
| **Production** | Instructor's | [magic-brooms.vercel.app](https://magic-brooms.vercel.app) | Don't break this one |

**Frontend:** Import your fork on [Vercel](https://vercel.com/new). Root directory = `bmad/app`. Add your Supabase env vars.

**Backend:** Create a free [Supabase](https://supabase.com/dashboard) project, then `npx supabase link && npx supabase db push`.

## Contribute

This counts as your open source side quest. Fork it, branch it, PR it.

```bash
git checkout -b feat/your-thing
# hack hack hack
npm run build                  # if TypeScript yells, fix it
git push origin feat/your-thing
# open PR on GitHub
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full walkthrough. Ideas if you need them:

- Dark mode
- Message threading
- Mobile fixes
- Accessibility
- New reactions
- Anything tagged [`good first issue`](../../labels/good%20first%20issue)

## Project Structure

```
bmad/app/              # The app. All your code goes here.
  src/features/        # Auth, channels, gallery, profile
  src/hooks/           # Data fetching (useMessages, useChannels, etc.)
  src/components/ui/   # Reusable UI bits
  supabase/migrations/ # Database schema (9 migrations)
devlog/                # How we got here (the whole experiment)
CONTRIBUTING.md        # How to contribute
```

## The Origin Story

We built this app five different ways with five AI frameworks to find out which one actually ships.

| Framework | What Happened |
|-----------|--------------|
| **BMAD Method** | Most complete. Auth, galleries, reactions, roles, 9 migrations. The one we shipped. |
| Compound Engineering | Best process. Great for teaching. The app was solid but not standout. |
| Superpowers | TDD everything. Most tests. Also most tokens burned. |
| Vanilla Claude Code | Fastest to get something working. First to hit a wall. |
| gstack | Prettiest. Design-first approach. Substance caught up eventually. |

BMAD won because it built the most complete thing that actually worked. The other versions are still in the repo as learning material. Check `devlog/` for the full story, or open `devlog/framework-comparison-report.html` for a visual comparison.

## License

[MIT](LICENSE)
