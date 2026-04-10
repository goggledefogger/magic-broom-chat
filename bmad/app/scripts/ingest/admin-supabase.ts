import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase admin client using the service_role key.
 *
 * Reads:
 *   - VITE_SUPABASE_URL     (reused from the app's .env.local)
 *   - SUPABASE_SERVICE_ROLE_KEY (must be added to .env.local for ingest work)
 *
 * The service_role key bypasses RLS and can use the auth admin API. This
 * client must NEVER be imported from application code or committed to the
 * browser bundle.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'VITE_SUPABASE_URL is missing. Set it in bmad/app/.env.local.',
    );
  }
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Add it to bmad/app/.env.local for ingest scripts. ' +
        'Get it from `npx supabase status` (local) or the Supabase dashboard (remote).',
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
