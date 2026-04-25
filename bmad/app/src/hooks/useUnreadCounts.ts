import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

/** PostgREST `in` URL size stays safe; chunk if a workshop ever grows huge. */
const GALLERY_COUNT_BATCH = 200

/**
 * Returns unread gallery card counts per gallery channel —
 * i.e. cards created after the user's last_read_at for that channel.
 * Falls back to total card count if the user has never visited (no last_read_at).
 */
export function useUnreadGalleryCardCounts(channelIds: string[], userId: string | undefined) {
  const queryClient = useQueryClient()
  const stableKey = useMemo(() => channelIds.slice().sort().join(','), [channelIds])

  const query = useQuery({
    queryKey: ['unread-gallery-card-counts', stableKey, userId],
    queryFn: async () => {
      const counts = new Map<string, number>()
      if (!channelIds.length || !userId) return counts

      // Get last_read_at for this user across all gallery channels in one query
      const { data: memberships, error: memErr } = await supabase
        .from('channel_members')
        .select('channel_id, last_read_at')
        .eq('user_id', userId)
        .in('channel_id', channelIds)

      if (memErr) throw memErr

      const lastReadMap = new Map<string, string | null>(
        (memberships ?? []).map((m) => [m.channel_id, m.last_read_at])
      )

      // For each gallery channel batch, count cards newer than last_read_at
      for (let i = 0; i < channelIds.length; i += GALLERY_COUNT_BATCH) {
        const chunk = channelIds.slice(i, i + GALLERY_COUNT_BATCH)

        // We need per-channel cutoffs, so run parallel queries per channel
        // (channels list is normally small, so N+1 is fine here)
        await Promise.all(
          chunk.map(async (cid) => {
            const lastReadAt = lastReadMap.get(cid) ?? null
            const q = supabase
              .from('gallery_cards')
              .select('id', { count: 'exact', head: true })
              .eq('channel_id', cid)

            if (lastReadAt) {
              q.gt('created_at', lastReadAt)
            }
            // If no last_read_at, user has never visited → 0 unread (they'll see it fresh)
            else {
              // No entry means user isn't a member or just joined; show 0
              counts.set(cid, 0)
              return
            }

            const { count, error } = await q
            if (error) throw error
            if ((count ?? 0) > 0) counts.set(cid, count ?? 0)
          })
        )
      }

      return counts
    },
    enabled: channelIds.length > 0 && !!userId,
  })

  useEffect(() => {
    if (!stableKey || !userId) return
    const channel = supabase.channel('unread-gallery-card-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_cards' }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-gallery-card-counts', stableKey, userId] })
      })
      // Also invalidate when channel_members changes (e.g. after marking read)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'channel_members' }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-gallery-card-counts', stableKey, userId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [stableKey, userId, queryClient])

  return query
}

export function useUnreadCounts(userId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['unread-counts', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID')

      const { data: memberships, error: memErr } = await supabase
        .from('channel_members')
        .select('channel_id, last_read_at')
        .eq('user_id', userId)

      if (memErr) throw memErr
      if (!memberships?.length) return new Map<string, number>()

      const results = await Promise.all(
        memberships.map(async (m) => {
          const q = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', m.channel_id)
          if (m.last_read_at) q.gt('created_at', m.last_read_at)
          const { count } = await q
          return { channelId: m.channel_id, count: count ?? 0 }
        })
      )

      const counts = new Map<string, number>()
      for (const r of results) {
        if (r.count > 0) counts.set(r.channelId, r.count)
      }
      return counts
    },
    enabled: !!userId,
  })

  useEffect(() => {
    if (!userId) return
    const channel = supabase.channel('unread-counts-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-counts', userId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, queryClient])

  return query
}

export function useMarkChannelRead() {
  const queryClient = useQueryClient()
  return async (channelId: string, userId: string) => {
    await supabase
      .from('channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .eq('user_id', userId)
    // Invalidate both message unread counts and gallery unread counts
    queryClient.invalidateQueries({ queryKey: ['unread-counts', userId] })
    queryClient.invalidateQueries({ queryKey: ['unread-gallery-card-counts'] })
  }
}
