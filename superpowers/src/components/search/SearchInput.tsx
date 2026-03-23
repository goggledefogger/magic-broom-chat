import { useState, useCallback } from 'react'

interface SearchInputProps {
  onSearch: (query: string) => void
}

export function SearchInput({ onSearch }: SearchInputProps) {
  const [query, setQuery] = useState('')

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch(query.trim())
    }
  }, [query, onSearch])

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Search messages..."
      className="w-full bg-gray-700 text-white text-sm rounded-md px-3 py-1.5 placeholder-gray-500"
    />
  )
}
