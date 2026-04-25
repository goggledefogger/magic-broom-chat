import { useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

export default function Sidebar({ channels, activeChannel, onSelectChannel, onChannelsChanged, unreadCounts = {} }) {
  const { presence } = useSocket();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const myChannels = channels.filter((c) => c.is_member);
  const otherChannels = channels.filter((c) => !c.is_member);

  const createChannel = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    if (res.ok) {
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      onChannelsChanged();
    }
  };

  const joinChannel = async (channel) => {
    await fetch(`/api/channels/${channel.id}/join`, {
      method: 'POST',
      credentials: 'include',
    });
    onChannelsChanged();
    onSelectChannel(channel);
  };

  const onlineCount = Object.values(presence).filter((p) => p.status === 'online').length;

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">Magic Broom</h1>
        <p className="text-xs text-gray-400">{onlineCount} online</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Channels
            </span>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="text-gray-400 hover:text-white text-lg leading-none"
              title="Create channel"
            >
              +
            </button>
          </div>

          {showCreate && (
            <form onSubmit={createChannel} className="mb-3 space-y-2">
              <input
                type="text"
                placeholder="channel-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 text-sm text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 text-sm text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-2 py-1 text-gray-400 text-xs hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {myChannels.map((channel) => {
            const isActive = activeChannel?.id === channel.id;
            const unread = isActive ? 0 : (unreadCounts[channel.id] ?? 0);
            const hasUnread = unread > 0;

            return (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`w-full text-left px-3 py-1.5 rounded text-sm mb-0.5 transition-colors flex items-center justify-between ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : hasUnread
                    ? 'text-white hover:bg-gray-700 font-semibold'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="truncate"># {channel.name}</span>
                {hasUnread && (
                  <span className="ml-2 shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center leading-none">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
            );
          })}

          {otherChannels.length > 0 && (
            <>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 block">
                Browse
              </span>
              {otherChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => joinChannel(channel)}
                  className="w-full text-left px-3 py-1.5 rounded text-sm mb-0.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
                >
                  # {channel.name}
                  <span className="text-xs ml-1 text-gray-600">join</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Online users */}
        <div className="p-3 border-t border-gray-700">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
            Users
          </span>
          {Object.entries(presence).map(([userId, info]) => (
            <div key={userId} className="flex items-center gap-2 py-1 text-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  info.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className="text-gray-300">{info.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
