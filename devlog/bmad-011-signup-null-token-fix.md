# bmad-011: Signup 500 caused by NULL token columns in auth.users

**Date:** 2026-04-14

## Symptom

A user reported: *"When I try creating an account from scratch, it doesn't work — it says I'm not in the database."*

Signups had silently stopped working on the live site. The most recent real signup in `auth.users` was 2026-04-09; no new rows since.

## Misleading first hypothesis

The initial code investigation pointed at the `handle_new_user` trigger and the `useProfile.ts` `.single()` query, theorizing a race between email confirmation and profile creation. That was wrong — trigger was healthy, all 12 existing users had matching `public.profiles` rows, and the flow had been stable since 04-01.

## Actual root cause

Supabase auth logs showed every `POST /signup` returning 500 with:

```
unable to find user email address for duplicates:
error finding user: sql: Scan error on column index 3,
name "confirmation_token": converting NULL to string is unsupported
```

This is a known GoTrue quirk: during signup it scans `auth.users` to check for duplicate emails, and its Go driver cannot scan `NULL` into a non-nullable `string` field. One bad row poisons **every** signup in the project.

Diagnostic query against `auth.users` found exactly one offending row:

- `a0667f1d-d2a9-4b23-99fc-10309ade2d24` — `dan@aportlandcareer.com`, created 2026-04-01 (the very first user, inserted manually before GoTrue's own signup path ran for anyone).
- NULL columns: `confirmation_token`, `email_change`, `email_change_token_new`, `recovery_token`.

Every subsequent user was created through GoTrue itself, which defaults those columns to `''`, not NULL — which is why only row #1 was broken and why the bug didn't show up until someone tried signing up from scratch.

## Fix

One-shot data repair via Supabase MCP `execute_sql`:

```sql
UPDATE auth.users
SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  email_change               = COALESCE(email_change, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR recovery_token IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;
```

Updated 1 row. Re-ran the NULL-count query — all columns now 0.

## Lessons

- **Read the auth logs before the code.** The trigger-race theory cost real exploration time; the actual error was sitting in plain text in the Supabase auth log from the user's failed attempt earlier that day.
- **"Not in the database"** was the user's paraphrase of a 500 from the signup endpoint, not a literal error string — the real error was a server-side scan failure.
- **If you ever insert directly into `auth.users` (imports, seeding, manual fixups), set the token columns to `''`, never NULL.** GoTrue's own Go structs assume non-nullable strings and blow up on NULL during the duplicate-email check.

## Next

- Verify the fix by performing a real signup on the live site.
- No code changes needed.
