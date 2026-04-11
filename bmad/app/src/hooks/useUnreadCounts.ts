import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

/** PostgREST `in` URL size stays safe; chunk if a workshop ever grows huge. */
const GALLERY_COUNT_BATCH = 200

export function useGalleryCardCounts(channelIds: string[]) {
  const queryClient = useQueryClient()
  const stableKey = useMemo(() => channelIds.slice().sort().join(','), [channelIds])

  const query = useQuery({
    queryKey: ['gallery-card-counts', stableKey],
    queryFn: async () => {
      const counts = new Map<string, number>()
      if (!channelIds.length) return counts
      for (let i = 0; i < channelIds.length; i += GALLERY_COUNT_BATCH) {
        const chunk = channelIds.slice(i, i + GALLERY_COUNT_BATCH)
        const { data, error } = await supabase
          .from('gallery_cards')
          .select('channel_id')
          .in('channel_id', chunk)
        if (error) throw error
        for (const row of data ?? []) {
          const cid = (row as { channel_id: string }).channel_id
          counts.set(cid, (counts.get(cid) ?? 0) + 1)
        }
      }
      return counts
    },
    enabled: channelIds.length > 0,
  })

  useEffect(() => {
    if (!stableKey) return
    const channel = supabase.channel('gallery-card-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_cards' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gallery-card-counts', stableKey] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [stableKey, queryClient])

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
    queryClient.invalidateQueries({ queryKey: ['unread-counts', userId] })
  }
}
