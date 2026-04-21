# bmad-012: Fantasia-themed slash commands

**Date:** 2026-04-21

## What shipped

A small slash-command layer in the message composer. Users type `/` + a keyword in any channel and the text gets transformed (or a UI action fires) before — or instead of — the normal send.

Six commands, all Sorcerer's Apprentice themed:

| Command | Effect |
|---|---|
| `/help` | Opens a dialog listing every command |
| `/shrug` | Sends `¯\_(ツ)_/¯` |
| `/me <action>` | `🎭 <your display name> <action>` |
| `/spell <msg>` | Wraps the message in ✨ sparkles ✨ |
| `/yensid <msg>` | `📜 YEN SID DECREES: <MSG>` (all caps, for drama) |
| `/broom <msg>` | Triples the message with 🧹 (the multiplying-brooms gag) |

## Shape of the change

```
src/features/commands/
  types.ts              # SlashCommand, CommandContext, CommandResult
  commands.ts           # the registry (all six commands)
  parseCommand.ts       # "/foo bar" -> { command, args }
  CommandHelpDialog.tsx # shadcn Dialog used by /help
  commands.test.ts      # 14 vitest unit tests
  index.ts              # barrel
```

`ChatView.tsx` learned three things:

1. Import `parseCommand` and `CommandHelpDialog`
2. Hold a `helpOpen` state
3. In `handleSubmit`, call `parseCommand(content)` before `sendMessage.mutate`. On match: execute, dispatch `send` / `consume`, clear input, return. On no match (plain text, or unknown `/foo`): fall through to normal send.

Unknown slash-prefixed text (e.g. `/nope`) is **not** intercepted — it sends as a normal message. This keeps the feature additive: nobody's existing muscle memory breaks.

## Key decisions

**Why a registry over a switch statement.** Adding a command is one array entry. The help dialog and the parser both read from the same source of truth, so there's no way for them to drift. This is the teaching win — future students can add commands without touching `ChatView`.

**Why not add `react-markdown`.** The original design sketch included `/me` as italic and `/yensid` as bold markdown. The app doesn't currently render markdown, so those would have shown as literal `_underscores_` and `**asterisks**`. Adding a markdown renderer is a separate concern (changes every message, not just command output). Emoji + unicode caps achieves the flair within the existing rendering pipeline.

**Why `/broom` sends a single message with three lines, not three separate messages.** Three `sendMessage.mutate` calls in quick succession would race, land out of order over Realtime, and stress RLS for no good reason. One insert with three `🧹 ...` lines preserves the joke cleanly.

**Why `/help` is a Dialog, not a special message.** An ephemeral "system message" rendered only for the caller would require either a new message type in the DB (overkill) or injecting a fake message into the client-side list (confusing). A Dialog is a standard shadcn pattern already used elsewhere in the app.

**Why skip `/topic`, `/hat`, `/summon`, `/banish`, `/flood` for now.** Each of those pulls in a separate subsystem — `/topic` needs a channel-update mutation and RLS thinking, `/hat` needs a new zustand store, `/summon` depends on real @mention infrastructure that doesn't exist yet, `/banish` couples the parser to the scroll viewport ref. All are good follow-ups; none belong in PR 1.

## Verification

- `npm run build` — TypeScript compiles clean
- `npm test` — 43/43 tests pass (14 new)
- `npm run lint` — no new errors from this change (the 9 pre-existing problems are unrelated files)

## What's next

Follow-up PRs, in roughly increasing scope:

1. **`/topic <text>`** for instructors — updates channel description via existing channel-update RPC, covered by RLS. Good way for students to learn about Postgres policies.
2. **`/hat`** — session-only "apprentice mode" badge that prepends 🎩 to the user's name in all their messages for this session. First real use of a zustand store in `stores/` (the dir CONTRIBUTING.md already advertises but that doesn't exist yet).
3. **Autocomplete** — when the user types `/`, show a floating command list above the composer. Nice UX win; larger change to the input component.
4. **Add `react-markdown`** — unlocks `**bold**`, `_italic_`, `\`code\`` everywhere, and lets slash commands return richer output.

## Time

Under an hour end-to-end. Most of it was reading `ChatView.tsx` to find the right integration seam and choosing which commands to cut.
