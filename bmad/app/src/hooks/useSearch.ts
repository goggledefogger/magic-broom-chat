import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SearchResult {
  type: 'message' | 'card'
  id: string
  channelId: string
  channelName: string
  content: string
  title?: string
  authorName: string | null
  createdAt: string
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return []

      const tsQuery = query.trim().split(/\s+/).join(' & ')
      const results: SearchResult[] = []

      // Search messages
      const { data: messages } = await supabase
        .from('messages')
        .select('id, channel_id, content, created_at, channels(name), profiles(display_name)')
        .textSearch('content', tsQuery)
        .limit(20)

      if (messages) {
        for (const m of messages) {
          const channel = m.channels as unknown as Record<string, unknown> | null
          const profile = m.profiles as unknown as Record<string, unknown> | null
          results.push({
            type: 'message',
            id: m.id,
            channelId: m.channel_id,
            channelName: (channel?.name as string) ?? 'Unknown',
            content: m.content,
            authorName: (profile?.display_name as string) ?? null,
            createdAt: m.created_at,
          })
        }
      }

      // Search gallery cards
      const { data: cards } = await supabase
        .from('gallery_cards')
        .select('id, channel_id, title, description, created_at, channels(name), profiles(display_name)')
        .or(`title.plfts.${tsQuery},description.plfts.${tsQuery}`)
        .limit(20)

      if (cards) {
        for (const c of cards) {
          const channel = c.channels as unknown as Record<string, unknown> | null
          const profile = c.profiles as unknown as Record<string, unknown> | null
          results.push({
            type: 'card',
            id: c.id,
            channelId: c.channel_id,
            channelName: (channel?.name as string) ?? 'Unknown',
            content: c.description ?? '',
            title: c.title,
            authorName: (profile?.display_name as string) ?? null,
            createdAt: c.created_at,
          })
        }
      }

      return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    enabled: query.trim().length > 0,
  })
}
