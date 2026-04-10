import type { SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

export function slugifyDisplayName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type GhostUserResolverConfig = {
  instructorDisplayNames: readonly string[];
};

export type GhostUserResolver = {
  resolve(authorDisplay: string): Promise<string>;
  stats(): { created: number; matched: number };
};

type ChannelCache = { general: string; resources: string } | null;

export function makeGhostUserResolver(
  client: SupabaseClient,
  config: GhostUserResolverConfig,
): GhostUserResolver {
  const cache = new Map<string, string>(); // author_display (normalized) → user_id
  let created = 0;
  let matched = 0;
  let channelCache: ChannelCache = null;
  const instructorSet = new Set(
    config.instructorDisplayNames.map((n) => n.trim().toLowerCase()),
  );

  async function loadChannelIds(): Promise<{ general: string; resources: string }> {
    if (channelCache) return channelCache;
    const { data, error } = await client
      .from('channels')
      .select('id, name')
      .in('name', ['general', 'resources']);
    if (error) throw new Error(`Failed to load channel ids: ${error.message}`);
    const byName = new Map<string, string>();
    for (const row of data ?? []) byName.set(row.name as string, row.id as string);
    const general = byName.get('general');
    const resources = byName.get('resources');
    if (!general || !resources) {
      throw new Error('Seed channels #general and #resources must exist before ingest');
    }
    channelCache = { general, resources };
    return channelCache;
  }

  async function ensureMembership(userId: string): Promise<void> {
    const { general, resources } = await loadChannelIds();
    // Upsert with ignoreDuplicates — the UNIQUE (channel_id, user_id) index
    // on channel_members gives us ON CONFLICT DO NOTHING semantics.
    const { error } = await client.from('channel_members').upsert(
      [
        { channel_id: general, user_id: userId },
        { channel_id: resources, user_id: userId },
      ],
      { onConflict: 'channel_id,user_id', ignoreDuplicates: true },
    );
    if (error) {
      throw new Error(`Failed to insert channel membership: ${error.message}`);
    }
  }

  async function resolve(authorDisplay: string): Promise<string> {
    const normalized = authorDisplay.trim().toLowerCase();
    const cached = cache.get(normalized);
    if (cached) return cached;

    // 1a. Look for an existing profile by exact display_name (case-insensitive).
    //     This matches real Magic Brooms users.
    let { data: existing, error: lookupErr } = await client
      .from('profiles')
      .select('id, display_name, role')
      .ilike('display_name', authorDisplay.trim())
      .maybeSingle();
    if (lookupErr) throw new Error(`Profile lookup failed: ${lookupErr.message}`);

    // 1b. Also look for a previously-imported ghost (display_name ends with " (imported)").
    //     This matches ghosts created on a prior run, making the resolver idempotent.
    if (!existing) {
      const { data: imported, error: importedErr } = await client
        .from('profiles')
        .select('id, display_name, role')
        .ilike('display_name', `${authorDisplay.trim()} (imported)`)
        .maybeSingle();
      if (importedErr) throw new Error(`Profile imported lookup failed: ${importedErr.message}`);
      if (imported) existing = imported;
    }

    if (existing) {
      cache.set(normalized, existing.id);
      matched += 1;
      await ensureMembership(existing.id);
      return existing.id;
    }

    // 2. Create a ghost user via the admin API.
    const slug = slugifyDisplayName(authorDisplay);
    const email = `imported+${slug}@magic-brooms.local`;
    const password = randomBytes(48).toString('base64'); // 64 chars, thrown away
    const { data: createdData, error: createErr } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: 'google-meet-email', imported: true },
    });
    if (createErr || !createdData?.user) {
      throw new Error(`Failed to create ghost user for ${authorDisplay}: ${createErr?.message}`);
    }
    const userId = createdData.user.id;

    // 3. Update the auto-created profile: display_name + role.
    const role = instructorSet.has(normalized) ? 'instructor' : 'student';
    const { error: updateErr } = await client
      .from('profiles')
      .update({ display_name: `${authorDisplay.trim()} (imported)`, role })
      .eq('id', userId);
    if (updateErr) throw new Error(`Failed to update profile for ${authorDisplay}: ${updateErr.message}`);

    cache.set(normalized, userId);
    created += 1;
    await ensureMembership(userId);
    return userId;
  }

  return {
    resolve,
    stats: () => ({ created, matched }),
  };
}
