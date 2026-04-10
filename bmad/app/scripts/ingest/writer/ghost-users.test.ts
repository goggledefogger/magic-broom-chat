// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeGhostUserResolver, slugifyDisplayName } from './ghost-users';

describe('slugifyDisplayName', () => {
  it('lowercases and replaces non-alphanumerics with hyphens', () => {
    expect(slugifyDisplayName('Danny Bauman')).toBe('danny-bauman');
    expect(slugifyDisplayName("  Dillon   Schultz ")).toBe('dillon-schultz');
    expect(slugifyDisplayName('wtswill@gmail.com')).toBe('wtswill-gmail-com');
  });
});

describe('makeGhostUserResolver', () => {
  let mockClient: any;
  let profilesRows: Array<{ id: string; display_name: string; role: string }>;
  let usersCreated: Array<{ email: string }>;
  let channelMembersInserted: Array<{ channel_id: string; user_id: string }>;

  beforeEach(() => {
    profilesRows = [];
    usersCreated = [];
    channelMembersInserted = [];

    mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              ilike: vi.fn((_col: string, value: string) => ({
                maybeSingle: vi.fn(async () => {
                  const normalized = value.replace(/%/g, '').toLowerCase();
                  const match = profilesRows.find(
                    (p) => p.display_name.toLowerCase() === normalized,
                  );
                  return { data: match ?? null, error: null };
                }),
              })),
            })),
            update: vi.fn((patch: any) => ({
              eq: vi.fn(async (_col: string, id: string) => {
                const row = profilesRows.find((p) => p.id === id);
                if (row) Object.assign(row, patch);
                return { error: null };
              }),
            })),
          };
        }
        if (table === 'channels') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(async () => ({
                data: [
                  { id: 'channel-general', name: 'general' },
                  { id: 'channel-resources', name: 'resources' },
                ],
                error: null,
              })),
            })),
          };
        }
        if (table === 'channel_members') {
          return {
            upsert: vi.fn(async (rows: any) => {
              const arr = Array.isArray(rows) ? rows : [rows];
              // Simulate ignoreDuplicates: skip rows whose (channel_id, user_id)
              // is already present.
              for (const row of arr) {
                const dupe = channelMembersInserted.find(
                  (m) => m.channel_id === row.channel_id && m.user_id === row.user_id,
                );
                if (!dupe) channelMembersInserted.push(row);
              }
              return { error: null };
            }),
          };
        }
        throw new Error(`Unmocked table: ${table}`);
      }),
      auth: {
        admin: {
          createUser: vi.fn(async ({ email }: { email: string }) => {
            const id = `user-${usersCreated.length + 1}`;
            usersCreated.push({ email });
            // Simulate the on_auth_user_created trigger inserting the profile.
            profilesRows.push({ id, display_name: '', role: 'student' });
            return { data: { user: { id } }, error: null };
          }),
        },
      },
    };
  });

  it('creates a new ghost user on first lookup, then reuses from cache', async () => {
    const resolver = makeGhostUserResolver(mockClient, {
      instructorDisplayNames: ['Danny Bauman'],
    });

    const id1 = await resolver.resolve('Dillon Schultz');
    const id2 = await resolver.resolve('Dillon Schultz');

    expect(id1).toBe(id2);
    expect(usersCreated).toHaveLength(1);
    expect(usersCreated[0].email).toBe('imported+dillon-schultz@magic-brooms.local');

    // Display name was updated with "(imported)" suffix
    const row = profilesRows.find((p) => p.id === id1);
    expect(row?.display_name).toBe('Dillon Schultz (imported)');
    expect(row?.role).toBe('student');
  });

  it('applies instructor role override for matching display names', async () => {
    const resolver = makeGhostUserResolver(mockClient, {
      instructorDisplayNames: ['Danny Bauman', 'Dan Hahn'],
    });

    await resolver.resolve('Danny Bauman');
    const danny = profilesRows.find((p) => p.display_name === 'Danny Bauman (imported)');
    expect(danny?.role).toBe('instructor');
  });

  it('matches an existing profile by display_name (case-insensitive) without creating', async () => {
    profilesRows.push({ id: 'existing-1', display_name: 'Melissa Cikara', role: 'student' });

    const resolver = makeGhostUserResolver(mockClient, {
      instructorDisplayNames: [],
    });
    const id = await resolver.resolve('melissa cikara');

    expect(id).toBe('existing-1');
    expect(usersCreated).toHaveLength(0);
  });

  it('matches a previously-imported ghost by display_name with "(imported)" suffix', async () => {
    // Simulate a prior run having already created this ghost.
    profilesRows.push({ id: 'ghost-1', display_name: 'Dillon Schultz (imported)', role: 'student' });

    const resolver = makeGhostUserResolver(mockClient, { instructorDisplayNames: [] });
    const id = await resolver.resolve('Dillon Schultz');

    expect(id).toBe('ghost-1');
    expect(usersCreated).toHaveLength(0);
  });

  it('ensures channel membership in general and resources for created ghost', async () => {
    const resolver = makeGhostUserResolver(mockClient, { instructorDisplayNames: [] });
    const id = await resolver.resolve('Damon Brennen');

    const forThisUser = channelMembersInserted.filter((m) => m.user_id === id);
    expect(forThisUser).toHaveLength(2);
    expect(forThisUser.map((m) => m.channel_id).sort()).toEqual(
      ['channel-general', 'channel-resources'].sort(),
    );
  });
});
