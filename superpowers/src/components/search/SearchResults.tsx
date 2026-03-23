import { Spinner } from '../ui/Spinner'
import type { Message } from '../../lib/types'

interface SearchResult extends Message {
  channel_name?: string
}

interface SearchResultsProps {
  results: SearchResult[]
  loading: boolean
  error: string | null
  onResultClick: (channelId: string, messageId: string) => void
  onClose: () => void
}

export function SearchResults({ results, loading, error, onResultClick, onClose }: SearchResultsProps) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-h-64 overflow-y-auto z-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-xs text-gray-400">Search Results</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xs">Close</button>
      </div>

      {loading && (
        <div className="flex justify-center py-4"><Spinner /></div>
      )}

      {error && <p className="text-red-400 text-sm px-3 py-2">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <p className="text-gray-500 text-sm px-3 py-4 text-center">No results found</p>
      )}

      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => onResultClick(result.channel_id, result.id)}
          className="w-full text-left px-3 py-2 hover:bg-gray-700/50 border-b border-gray-700/50 last:border-0"
        >
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span># {result.channel_name ?? 'unknown'}</span>
            <span>{new Date(result.created_at).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-gray-300 truncate">{result.content}</p>
        </button>
      ))}
    </div>
  )
}
