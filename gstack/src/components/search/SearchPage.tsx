import { useState, useCallback, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router'
import { useSearch } from '@/hooks/useSearch'
import { useChannels } from '@/hooks/useChannels'
import { Input } from '@/components/ui/input'
import { Search, Hash } from 'lucide-react'

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const words = query.trim().split(/\s+/).filter(Boolean)
  const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts = text.split(pattern)

  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="rounded-sm bg-yellow-300/40 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }
  if (days === 1) return 'Yesterday'
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const { results, loading, search } = useSearch()
  const { channels } = useChannels()
  const navigate = useNavigate()

  const channelMap = new Map(channels.map((c) => [c.id, c]))

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setQuery(value)
      search(value)
    },
    [search],
  )

  const handleResultClick = useCallback(
    (channelId: string) => {
      navigate(`/channel/${channelId}`)
    },
    [navigate],
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={handleChange}
            placeholder="Search messages..."
            className="pl-9"
            autoFocus
          />
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {!loading && !query.trim() && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Search across all messages in your workspace
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-1 p-2">
            {results.map((result) => {
              const channel = channelMap.get(result.channel_id)
              return (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.channel_id)}
                  className="w-full rounded-lg border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-accent"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {channel && (
                      <span className="flex items-center gap-1 font-medium">
                        <Hash className="size-3" />
                        {channel.name}
                      </span>
                    )}
                    <span>{formatDate(result.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {highlightMatch(result.content, query)}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
