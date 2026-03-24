import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, Hash } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useSearch } from '@/hooks/useSearch'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SearchPage() {
  const navigate = useNavigate()
  const { results, loading, query, search } = useSearch()
  const [input, setInput] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    search(input)
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-clay-200 bg-sand-50">
        <Search className="h-4 w-4 text-clay-400" />
        <h1 className="text-sm font-semibold text-sand-800">Search messages</h1>
      </header>

      <div className="px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search messages..."
            className="flex-1"
            autoFocus
          />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {loading && <p className="text-sm text-clay-400 py-4">Searching...</p>}

        {!loading && query && results.length === 0 && (
          <p className="text-sm text-clay-400 py-4">No results for "{query}"</p>
        )}

        {results.map(result => (
          <button
            key={result.id}
            onClick={() => result.channelSlug && navigate(`/channels/${result.channelSlug}`)}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-sand-100 mb-1"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Hash className="h-3 w-3 text-clay-400" />
              <span className="text-xs font-medium text-clay-500">{result.channelName}</span>
              <span className="text-xs text-clay-300 mx-1">·</span>
              <span className="text-xs text-clay-400">{result.displayName}</span>
              <span className="text-xs text-clay-300 mx-1">·</span>
              <span className="text-xs text-clay-300">{formatDate(result.created_at)}</span>
            </div>
            <p className="text-sm text-sand-700 line-clamp-2">{result.content}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
