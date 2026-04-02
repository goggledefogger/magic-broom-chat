import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header({ channel, onSearch, showSearch, onCloseSearch }) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">
          {channel ? `# ${channel.name}` : 'Magic Brooms'}
        </h2>
        {channel?.description && (
          <span className="text-sm text-gray-400 hidden sm:inline">{channel.description}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-3 py-1.5 bg-gray-700 text-sm text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none w-48"
          />
          {showSearch && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onCloseSearch();
              }}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </form>
        <span className="text-sm text-gray-400">{user?.displayName}</span>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
