-- Fix privilege escalation: prevent students from promoting themselves to instructor.
--
-- The profiles_update_own policy (00001) allows a user to UPDATE their own row,
-- but RLS gates ROWS, not COLUMNS. With no column restriction, a student could
-- `update profiles set role = 'instructor' where id = <self>` and gain the
-- instructor powers granted elsewhere (delete any message/card, edit channels).
--
-- The app only ever writes display_name/avatar_url/updated_at (see useProfile.ts);
-- role is assigned out-of-band by an admin using the service_role key, which
-- bypasses RLS and column grants. So restrict the authenticated role to exactly
-- the columns the client legitimately updates. Any new user-updatable column must
-- be added to the GRANT below.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, updated_at) ON public.profiles TO authenticated;
