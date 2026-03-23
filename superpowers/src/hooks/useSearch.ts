import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../lib/types'

interface SearchResult extends Message {
  channel_name?: string
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    const tsquery = query.trim().split(/\s+/).join(' & ')

    const { data, error } = await supabase
      .from('messages')
      .select('*, channels!inner(name)')
      .textSearch('fts', tsquery)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      setError(error.message)
    } else {
      setResults(
        (data ?? []).map((row: any) => ({
          ...row,
          channel_name: row.channels?.name,
        }))
      )
    }
    setLoading(false)
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, loading, error, search, clearResults }
}
