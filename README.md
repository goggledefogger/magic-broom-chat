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
