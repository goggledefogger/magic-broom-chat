# bmad-013: Missing /reset-password page + misleading repeat-signup UX

**Date:** 2026-04-21

## Symptom

Dan (`dan@aportlandcareer.com`) reported he couldn't sign in. He'd forgotten his password, clicked "Forgot password", got the email, clicked the link — and was then unable to actually log in with any password he tried.

## What the auth logs showed

Pulled Supabase auth logs for his IP. His full timeline was:

| Time (UTC) | Event | Result |
|---|---|---|
| 23:36:09 | POST `/recover` | 200 — reset email sent |
| 23:36:34 | GET `/verify` (referer `/reset-password`) | 303 — recovery link verified, implicit session issued |
| 23:37:07 | POST `/signup` | 200, `action: "user_repeated_signup"` |
| 00:10:33 | POST `/token` (password grant) | **400 `invalid_credentials`** |

The critical gap: **no `POST /user` between `/verify` and the later `/signup`.** He'd landed on the reset page but never actually submitted a new password.

## Two shipped bugs

### Bug 1 — `/reset-password` route didn't exist

`useAuth.ts:53` sends the recovery email with `redirectTo: ${origin}/reset-password`, but `App.tsx` had no matching route. The catch-all `<Route path="*" element={<Navigate to="/" replace />} />` sent Dan to `/`. Because Supabase had issued an implicit recovery session via the `/verify` 303, he was "logged in" and landed on the channel list. He never saw a form to set a new password — his old one stayed unchanged, and when the recovery session ended he was locked back out.

### Bug 2 — repeat signup silently "succeeded"

Supabase's anti-enumeration behavior returns 200 with `data.user.identities: []` and no session when the email already exists. `SignupPage.tsx` only checked `data.session` — null session meant "email confirmation pending" and showed "Scroll Dispatched", misleading Dan into waiting for a confirmation email that would never arrive (none is sent for repeat signups).

The two bugs conspired: Bug 1 stranded Dan without a way to reset, Bug 2 made his signup-again workaround look successful when it wasn't.

## Fix

- New `ResetPasswordPage.tsx` at `/reset-password`, wired to `updateUser({ password })`. Checks for a live session on mount; shows an "invalid/expired scroll" state with a link back to `/forgot-password` if the session is absent. Also listens for `PASSWORD_RECOVERY` via `onAuthStateChange` for fragment-token flows.
- `SignupPage.tsx` now detects repeat signups via `data.user.identities?.length === 0` and shows a dedicated "already enrolled" state pointing at sign-in or password reset. The misleading "Scroll Dispatched" screen only appears for genuine new signups pending confirmation.

## Operational cleanup

- Deleted Dan's row from `auth.users` (profile + 7 channel_members cascaded cleanly; 0 messages/gallery/reactions/comments attached). He can now sign up fresh.
- bmad-011's NULL-token fix is still holding — 0 NULL rows across all token columns in `auth.users`.

## Lessons

- **Log-first beats code-first here too, same as bmad-011.** The full timeline was sitting in the Supabase auth log. The missing `POST /user` between `/verify` and `/signup` was the load-bearing clue — no amount of staring at React code would have surfaced that.
- **A "no-op 200" from Supabase is worse than an error.** Enumeration-protection behavior needs explicit UI detection (`identities.length === 0`) or it becomes a UX trap.
- **Every redirect URL the client asks Supabase to use must have a matching route.** The `redirectTo: /reset-password` was shipped without the route ever existing. A simple grep for `redirectTo:` against `App.tsx` routes would have caught this; worth adding to the CI story if more of these accumulate.
- **Almost deployed to the wrong Vercel project.** A stray `.vercel/` had materialized at the repo root (linked to a dead `magic-broom-chat` sibling project) and a `vercel --prod --yes` from root went there instead of to the real `magic-brooms` project under `bmad/app/`. Fix was to `rm -rf` the stray link and re-run from `bmad/app/`. CLAUDE.md already says to run the manual deploy from `bmad/app/`; this is why.

## Follow-ups

- When the Vercel GitHub integration is reconnected (still open from bmad-010), push-to-main will re-become the deploy and the `cd bmad/app` step disappears.
- Consider whether to also surface a "did you mean to sign in?" hint on the login page's `invalid_credentials` error state, to short-circuit the forgot→signup confusion earlier in the flow.
