import { useState } from 'react';
import { User } from 'firebase/auth';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

interface ChatLayoutProps {
  user: User;
}

export default function ChatLayout({ user }: ChatLayoutProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        user={user} 
        selectedChannelId={selectedChannelId} 
        onSelectChannel={setSelectedChannelId} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannelId ? (
          <ChatArea user={user} channelId={selectedChannelId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to Magic Brooms</h2>
              <p className="text-gray-500">Select a channel from the sidebar to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
