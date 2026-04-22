# Contributing to Magic Brooms

Thanks for wanting to contribute! This guide will help you get set up and submit your first pull request.

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- **Docker** — install and run the Docker engine **before** starting local Supabase; see [step 3](#3-install-and-run-docker).
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

### 3. Install and run Docker

Local Supabase is a set of **containers**. The Supabase CLI talks to the Docker daemon (for example `unix:///var/run/docker.sock` on macOS and Linux). **Install Docker and start the engine before `npx supabase start`**, or the CLI will fail with errors like `Cannot connect to the Docker daemon`.

**macOS and Windows:** The path most people use is [Docker Desktop](https://docs.docker.com/desktop/) — install it, launch it, and wait until the engine is running. If you do not want Docker Desktop, use one of the [alternatives below](#alternatives-to-docker-desktop-macos-and-windows); you still need a **Docker-compatible** engine and `docker` CLI so `docker info` succeeds.

**Linux:** Install [Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) (Compose v2 is bundled with recent Engine packages on many distros). Start the daemon (`sudo systemctl start docker` on systemd setups) and ensure your user can use the socket (often by adding your account to the `docker` group, then signing out and back in).

#### Alternatives to Docker Desktop (macOS and Windows)

Local Supabase is not “containerless” — it still runs containers — but you can use any tool that exposes **Docker-compatible APIs** to the CLI. The Supabase docs list [Rancher Desktop](https://rancherdesktop.io/), [Podman](https://podman.io/), [OrbStack](https://orbstack.dev/) (macOS), and [Colima](https://github.com/abiosoft/colima) (macOS) alongside Docker Desktop; see [Running Supabase locally](https://supabase.com/docs/guides/cli/getting-started#running-supabase-locally). Pick one stack, finish its setup, then confirm with `docker info` (or the tool’s equivalent) from the same shell you will use for `npx supabase start`.

**macOS**

- [OrbStack](https://orbstack.dev/) or [Colima](https://github.com/abiosoft/colima) — common lightweight options; Colima is usually paired with the Docker CLI (for example `brew install docker`) and started with `colima start`.
- [Rancher Desktop](https://rancherdesktop.io/) — enable the **Moby / dockerd** backend so the normal `docker` and `docker compose` commands work.
- [Podman](https://podman.io/) — only if you configure a **Docker-compatible socket** and CLI shim so Supabase’s use of the Docker API succeeds (Podman’s docs cover `podman machine` and Docker interop).

**Windows**

- [Rancher Desktop](https://rancherdesktop.io/) — same idea as on macOS; use the app’s Docker/Moby compatibility mode so `docker info` works in PowerShell or cmd.
- [Podman](https://podman.io/) — same caveat as on macOS: you need Docker API compatibility and, for some setups, [extra socket configuration](https://supabase.com/docs/guides/cli/getting-started#running-supabase-locally) (the CLI may expect `tcp://localhost:2375` on Windows depending on your environment).
- **Docker Engine inside [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/)** — install a Linux distro (for example Ubuntu), follow [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/) *inside that distro*, and run your clone, `npm install`, and `npx supabase start` from a **WSL terminal** so Node and Docker share the same socket. (Running Windows Node against Docker only inside WSL often breaks; keeping the whole dev session in WSL avoids that.)

Confirm Docker is usable from the same shell you will use for Supabase:

```bash
docker info
```

That command should print server details, not a connection error. If it fails, fix Docker first, then continue to the next step.

### 4. Start a local Supabase database

**You should always develop against a local database, never the production one.**

Supabase runs entirely on your machine via Docker. This gives you your own database, auth server, and realtime engine — identical to production but completely isolated.

```bash
cd bmad/app

# Start the local Supabase stack (first run downloads Docker images — takes a few minutes).
# Uses npx so you do not need a global install; Supabase no longer supports `npm install -g supabase`.
npx supabase start
```

#### Optional: install the CLI on your PATH

`npx` is enough for day-to-day work. If you want a `supabase` command available everywhere, use one of the [supported installers](https://github.com/supabase/cli#install-the-cli):

**macOS** ([Homebrew](https://brew.sh)):

```bash
brew install supabase/tap/supabase
```

**Windows** ([Scoop](https://scoop.sh)):

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux** — [Homebrew on Linux](https://docs.brew.sh/Homebrew-on-Linux) works the same as on macOS (`brew install supabase/tap/supabase`). Otherwise download the matching package from [CLI releases](https://github.com/supabase/cli/releases) and install, for example:

```bash
sudo dpkg -i <file>.deb                        # Debian / Ubuntu
sudo rpm -i <file>.rpm                         # Fedora / RHEL
sudo apk add --allow-untrusted <file>.apk      # Alpine
sudo pacman -U <file>.pkg.tar.zst             # Arch
```

Use the `.deb` / `.rpm` / `.apk` / `.pkg.tar.zst` asset names from the release you downloaded.

When it finishes, you'll see output like:

```
         API URL: http://127.0.0.1:54321
     Studio URL: http://127.0.0.1:54323
        anon key: eyJh......
service_role key: eyJh......
```

The **Studio URL** gives you a local dashboard to browse your database, just like the cloud version.

### 5. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with the local values from the output above:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJh......   # paste the anon key from supabase start
```

The migrations in `supabase/migrations/` are automatically applied when you run `supabase start`, so your local database already has the full schema.

### 6. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173). Sign up with any email — the local auth server accepts everything and doesn't actually send emails. Check the local [Mailpit](http://localhost:54324) to see confirmation emails.

### 7. Stop Supabase when you're done

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

## For Instructors: Merging PRs

The `main` branch is protected — all changes require a PR with at least one approving review. Admins (instructors) can bypass this to merge their own work.

### Merging with admin bypass

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch --admin
```

The `--admin` flag overrides the review requirement. Use `--squash` to keep the commit history clean.

### Merging student PRs

Student PRs require your review and approval first:

1. Review on GitHub or via `gh pr review <PR_NUMBER>`
2. Approve if it looks good
3. Merge: `gh pr merge <PR_NUMBER> --squash --delete-branch`

### Branch protection settings

Configured via GitHub API or **Settings > Branches** on GitHub:

- 1 approving review required (for non-admins)
- Stale reviews dismissed on new pushes
- Admin bypass enabled (`enforce_admins: false`)
- Force pushes blocked

## Need Help?

- Check existing code for patterns to follow
- Look at the `devlog/` for context on past decisions
- Ask in the `#general` channel on the [live app](https://magic-brooms.vercel.app)
- Open a GitHub issue if you're stuck

## Using AI Tools

You're encouraged to use AI tools (Claude Code, Cursor, etc.) to help with your contributions — this is an AI-assisted development course after all! Just make sure you understand the code you're submitting.
