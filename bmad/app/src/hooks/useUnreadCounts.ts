import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useUnreadCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ['unread-counts', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID')

      // Get all memberships with last_read_at
      const { data: memberships, error: memErr } = await supabase
        .from('channel_members')
        .select('channel_id, last_read_at')
        .eq('user_id', userId)

      if (memErr) throw memErr
      if (!memberships?.length) return new Map<string, number>()

      const counts = new Map<string, number>()

      for (const membership of memberships) {
        const query = supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('channel_id', membership.channel_id)

        if (membership.last_read_at) {
          query.gt('created_at', membership.last_read_at)
        }

        const { count } = await query
        if (count && count > 0) {
          counts.set(membership.channel_id, count)
        }
      }

      return counts
    },
    enabled: !!userId,
    refetchInterval: 30000, // Poll every 30s as a fallback
  })
}

export function useMarkChannelRead() {
  return async (channelId: string, userId: string) => {
    await supabase
      .from('channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .eq('user_id', userId)
  }
}
