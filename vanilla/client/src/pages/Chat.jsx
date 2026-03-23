import { useState, useEffect } from 'react';
import { SocketProvider } from '../context/SocketContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import MessagePane from '../components/MessagePane.jsx';
import SearchResults from '../components/SearchResults.jsx';
import Header from '../components/Header.jsx';

export default function Chat() {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const loadChannels = async () => {
    const res = await fetch('/api/channels', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setChannels(data);
      if (!activeChannel && data.length > 0) {
        setActiveChannel(data.find((c) => c.is_member) || data[0]);
      }
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  return (
    <SocketProvider>
      <div className="flex h-screen bg-gray-900 text-gray-100">
        <Sidebar
          channels={channels}
          activeChannel={activeChannel}
          onSelectChannel={setActiveChannel}
          onChannelsChanged={loadChannels}
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
                  setActiveChannel(ch);
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
    </SocketProvider>
  );
}
