import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type SearchResult = Database['public']['Functions']['search_messages']['Returns'][number]

const DEBOUNCE_MS = 300

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    timerRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_messages', {
        search_query: query,
      })

      if (!error && data) {
        setResults(data)
      }
      setLoading(false)
    }, DEBOUNCE_MS)
  }, [])

  return { results, loading, search }
}
