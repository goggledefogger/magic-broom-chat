# AI Studio — Kickoff & First Impressions

**Date:** 2026-03-31
**Framework:** Google AI Studio
**Phase:** Kickoff / Initial Setup

## What Happened

Pasted the shared kickoff prompt into Google AI Studio. The initial response was clean — it understood the project and got started smoothly.

## Firebase Integration — Almost Great

AI Studio immediately moved to set up Firebase as its backend, which was a notable tech stack choice (every other framework version chose Supabase). The experience was impressively integrated:

- AI Studio prompted to accept Firebase terms of service directly in the UI
- This felt slightly unexpected at first, but was actually nice — it meant AI Studio was going to provision a real database, not just generate code
- The tight Firebase integration shows Google leveraging its ecosystem

## The Snag

After accepting the Firebase terms, it hit an internal error:
1. Accepted Firebase terms → "continue setting up the database"
2. Got an error, then the setup was canceled with "an internal error occurred"
3. Clicked retry — still not working

## Key Observations

- **Tech stack choice:** AI Studio chose Firebase — unsurprising since Google owns both. All Claude Code variants chose Supabase.
- **Integrated provisioning:** The idea of setting up real infrastructure directly from the AI assistant is compelling — a step beyond just generating code.
- **Reliability:** The integrated approach is only as good as the underlying service reliability. When it breaks, you're stuck — no workaround like manually setting up a database.
- **First impression:** "Almost great" — the vision is right, the execution isn't quite there yet.

## Recovery

After the initial error: refreshed the page, got the Firebase terms popup again, accepted again, and this time it went through. Showing a blank white screen — possibly the app loading or ready to render.

**Total friction:** ~2-3 minutes of error/retry/refresh to get past setup. Not a dealbreaker, but the kind of rough edge you'd expect from a Google AI product at the frontier.

## First Working(ish) App

The app did render — Google auth login worked, and there was a UI. But:

- **No default channel** — landed on an empty state with no obvious way to start chatting
- **Poor visual affordances** — there's a "+" button to create a channel, but the colors/contrast made it nearly invisible. Felt like an error state rather than an empty state.
- The app was *close* to working but the UX gap made it feel broken.

## Voice Input — Silent Failure

Tried using AI Studio's built-in voice input (microphone button on the chat input) to describe the UI issues. The experience:

1. Recorded a voice message about not being able to find channel creation
2. Audio was processed
3. **Silently failed** — no transcription, no error message, just an ambiguous error icon
4. No way to tell what went wrong or retry meaningfully

## Running Tally of Friction

| Step | Issue |
|------|-------|
| Firebase setup | Internal error, required refresh + re-accept terms |
| First render | Blank white screen before loading |
| App UX | No default channel, hard-to-see controls |
| Voice input | Silent failure with no error message |

## It Actually Looks Good

Once past the initial confusion, the app works and **looks great**:

- Channel creation works
- Messaging works
- The UI is polished — better first-pass visual quality than most of the Claude Code variants
- Firebase + Google Cloud backing means real infrastructure out of the box

The core product vision — integrated AI dev with real cloud provisioning — delivers when it works.

## ...But Then More Breakage

Tried to type feedback into AI Studio to iterate on the UI. Hit another internal error:

- Submit → internal error
- Retry → still broken
- Got a bizarre warning: "the desired model is no longer available, so a new model was selected"
- The model is marked "preview," so this may be a known instability issue with preview-tier models getting rotated or hitting capacity

This is the core problem: **AI Studio can't reliably sustain an iterative development session.** The initial generation is impressive, but the edit-iterate loop keeps breaking.

## Running Tally of Friction

| Step | Issue |
|------|-------|
| Firebase setup | Internal error, required refresh + re-accept terms |
| First render | Blank white screen before loading |
| App UX | No default channel, hard-to-see controls |
| Voice input | Silent failure with no error message |
| Iterating on UI | Internal error on submit, retry failed, mystery model swap warning |

## What's Next

Try refreshing / restarting the session to see if iteration is possible at all.
