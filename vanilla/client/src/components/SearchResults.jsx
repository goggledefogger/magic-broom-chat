import { useState, useEffect } from 'react';

export default function SearchResults({ query, onNavigate }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) return;
    setLoading(true);
    fetch(`/api/messages/search/all?q=${encodeURIComponent(query)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setResults(data);
      })
      .finally(() => setLoading(false));
  }, [query]);

  const formatTime = (dateStr) => {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Searching...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">
        {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </h3>
      {results.length === 0 ? (
        <p className="text-gray-500 text-sm">No messages found.</p>
      ) : (
        <div className="space-y-3">
          {results.map((msg) => (
            <button
              key={msg.id}
              onClick={() => onNavigate(msg.channel_id)}
              className="w-full text-left p-3 bg-gray-800 rounded hover:bg-gray-750 transition-colors block"
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-white">
                  {msg.display_name || msg.username}
                </span>
                <span className="text-xs text-blue-400">#{msg.channel_name}</span>
                <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
              </div>
              <p className="text-sm text-gray-300">{msg.content}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
