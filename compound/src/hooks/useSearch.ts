import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SearchResult {
  id: string
  channel_id: string
  user_id: string
  content: string
  created_at: string
  rank: number
  // Joined data
  channelName?: string
  channelSlug?: string
  displayName?: string
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  async function search(searchQuery: string) {
    const trimmed = searchQuery.trim()
    setQuery(trimmed)
    if (!trimmed) {
      setResults([])
      return
    }

    setLoading(true)
    const { data } = await supabase.rpc('search_messages', { search_query: trimmed })

    if (data) {
      // Fetch channel and profile info for results
      const channelIds = [...new Set(data.map(r => r.channel_id))]
      const userIds = [...new Set(data.map(r => r.user_id))]

      const [channelsRes, profilesRes] = await Promise.all([
        supabase.from('channels').select('id, name, slug').in('id', channelIds),
        supabase.from('profiles').select('id, display_name').in('id', userIds),
      ])

      const channelMap = new Map(channelsRes.data?.map(c => [c.id, c]) ?? [])
      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) ?? [])

      const enriched: SearchResult[] = data.map(r => ({
        ...r,
        channelName: channelMap.get(r.channel_id)?.name,
        channelSlug: channelMap.get(r.channel_id)?.slug,
        displayName: profileMap.get(r.user_id)?.display_name,
      }))

      setResults(enriched)
    }
    setLoading(false)
  }

  return { results, loading, query, search }
}
