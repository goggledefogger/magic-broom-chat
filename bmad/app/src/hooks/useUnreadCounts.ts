import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useGalleryCardCounts(channelIds: string[]) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['gallery-card-counts', channelIds],
    queryFn: async () => {
      const counts = new Map<string, number>()
      for (const channelId of channelIds) {
        const { count } = await supabase
          .from('gallery_cards')
          .select('id', { count: 'exact', head: true })
          .eq('channel_id', channelId)
        if (count && count > 0) {
          counts.set(channelId, count)
        }
      }
      return counts
    },
    enabled: channelIds.length > 0,
  })

  // Refresh when gallery cards change
  useEffect(() => {
    if (!channelIds.length) return
    const channel = supabase.channel('gallery-card-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_cards' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gallery-card-counts'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [channelIds, queryClient])

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

  // Refresh unread counts on any message insert or delete
  useEffect(() => {
    if (!userId) return
    const channel = supabase.channel('unread-counts-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
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
    queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
  }
}
