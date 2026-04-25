import { useState, useEffect } from 'react';
import { SocketProvider } from '../context/SocketContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import MessagePane from '../components/MessagePane.jsx';
import SearchResults from '../components/SearchResults.jsx';
import Header from '../components/Header.jsx';

// Inner component so it can use the SocketContext that SocketProvider creates
function ChatInner() {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { unreadCounts, markChannelRead, seedUnreadCounts, setActiveChannelRef } = useSocket();

  const loadChannels = async () => {
    const res = await fetch('/api/channels', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setChannels(data);
      // Seed unread counts from server data (handles page load / refresh)
      seedUnreadCounts(data);
      if (!activeChannel && data.length > 0) {
        const first = data.find((c) => c.is_member) || data[0];
        handleSelectChannel(first);
      }
    }
  };

  const handleSelectChannel = (channel) => {
    setActiveChannel(channel);
    // Keep the ref up-to-date so socket handler knows what's active
    setActiveChannelRef(channel?.id ?? null);
    // Mark the channel as read immediately
    if (channel?.id) {
      markChannelRead(channel.id);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar
        channels={channels}
        activeChannel={activeChannel}
        onSelectChannel={handleSelectChannel}
        onChannelsChanged={loadChannels}
        unreadCounts={unreadCounts}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          channel={activeChannel}
          onSearch={(q) => {
            setSearchQuery(q);
            setShowSearch(!!q);
          }}
          showSearch={showSearch}
          onCloseSearch={() => setShowSearch(false)}
        />
        {showSearch ? (
          <SearchResults
            query={searchQuery}
            onNavigate={(channelId) => {
              const ch = channels.find((c) => c.id === channelId);
              if (ch) {
                handleSelectChannel(ch);
                setShowSearch(false);
                setSearchQuery('');
              }
            }}
          />
        ) : activeChannel ? (
          <MessagePane channel={activeChannel} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a channel to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  return (
    <SocketProvider>
      <ChatInner />
    </SocketProvider>
  );
}
