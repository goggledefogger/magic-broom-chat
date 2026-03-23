# Superpowers 005 — Task 4: Auth Hook + Tests

**Date:** 2026-03-22
**Framework:** Superpowers
**Phase:** Implementation — Task 4 (Auth Hook + Tests)

## What Was Completed

Implemented the auth layer for Magic Broom Chat following strict TDD:

1. **Replaced `src/tests/setup.ts`** with a `createMockSupabase()` factory that produces fully vi.fn()-based mock objects covering `auth`, `from`, `channel`, and `removeChannel`. This factory pattern allows each test module to get a fresh mock via `vi.mock()`.

2. **Wrote failing tests first** (`src/tests/hooks/useAuth.test.ts`) covering three behaviors:
   - Loading state starts `true`, resolves to `false` after `getSession` settles
   - `signIn` calls `supabase.auth.signInWithPassword` with the right args and returns `{ error: null }`
   - `signOut` calls `supabase.auth.signOut`

3. **Confirmed red** — tests failed with "Failed to resolve import" since the hook didn't exist yet.

4. **Created `src/contexts/AuthContext.tsx`** — thin context file exporting `AuthContextType` interface and the `AuthContext` itself.

5. **Created `src/hooks/useAuth.ts`** — `AuthProvider` component using `createElement` (avoids JSX in `.ts`), and `useAuth` hook that throws if used outside the provider.

6. **Confirmed green** — all 3 tests passed in 174ms.

## Key Decisions

- **`.ts` not `.tsx` for useAuth** — The hook uses `createElement` directly so no JSX transform is needed. Keeps the file extension honest.
- **Separate AuthContext file** — Isolates the context/type from the hook implementation, which will matter when other hooks or components need to import the type without pulling in hook logic.
- **`createMockSupabase` factory** — Using a factory (rather than a single shared mock object) means `vi.mock()` gets a fresh instance per test file, preventing state leakage between test suites.

## Effort

4 steps of actual work (write setup, write tests, write context, write hook) plus 2 test runs. Zero friction — the TDD loop was tight and clean. No back-and-forth needed; everything compiled and passed on the first implementation attempt.

## Surprising / Noteworthy

The `beforeEach` import in the test file is unused (included in the task template but not needed for these three tests). Left it in to match the task spec exactly.

The mock factory's `onAuthStateChange` pushes callbacks into a shared `authListeners` array exposed as `_listeners` — useful for future tests that need to simulate auth state change events by calling those listeners directly.

## What's Next

Task 5: Auth UI — Login and SignUp components (`LoginPage`, `SignUpPage`) that wire up to `useAuth`.
