# Magic Broom Chat

The chat app we built *with AI, for learning AI*. Real-time, real users, real code — and you helped make it.

**Live now:** [magic-brooms.vercel.app](https://magic-brooms.vercel.app)

## What Is This

A Slack-style chat app for Portland Career's AI-Assisted Software Development course. You're not just learning about AI-assisted dev — you're using the product of it every day.

Real-time messaging. Channels. Gallery showcases. Emoji reactions. Full-text search. Instructor tools. A Sorcerer's Apprentice theme because why not.

**Stack:** React 19 / TypeScript / Vite / Tailwind / Supabase / Vercel

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

This counts as your **open source side quest**. Fork it, branch it, PR it.

```bash
git checkout -b feat/your-thing
# hack hack hack
npm run build                  # if TypeScript yells, fix it
git push origin feat/your-thing
# open PR on GitHub
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full walkthrough. Ideas if you need 'em:

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

We built this app *five different ways* with five AI frameworks, head-to-head, to find out which one actually ships. Arrr, the results:

| Framework | What Happened |
|-----------|--------------|
| **BMAD Method** | Walked the plank last and came back with a full ship. Auth, galleries, reactions, roles, 9 migrations. **The winner.** |
| Compound Engineering | Best process. Great for teaching. The app itself? Serviceable, not spectacular. |
| Superpowers | TDD everything. Most tests. Also most tokens burned. Your wallet felt that one. |
| Vanilla Claude Code | Fastest to "something works." First to hit a wall. No framework = no guardrails. |
| gstack | Prettiest of the bunch. Design-first energy. Substance caught up eventually. |

BMAD won because it built the most complete thing that actually worked. Not the fastest, not the cheapest — the most *shippable*.

The other versions are still here as educational treasure. Dig through `devlog/` for the full saga, or open `devlog/framework-comparison-report.html` for the visual showdown.

## License

[MIT](LICENSE)
