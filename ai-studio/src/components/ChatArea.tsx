import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Hash, Search } from 'lucide-react';

interface ChatAreaProps {
  user: User;
  channelId: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
}

export default function ChatArea({ user, channelId }: ChatAreaProps) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!channelId) return;

    const unsubscribe = onSnapshot(doc(db, 'channels', channelId), (doc) => {
      if (doc.exists()) {
        setChannel({ id: doc.id, ...doc.data() } as Channel);
      } else {
        setChannel(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `channels/${channelId}`);
    });

    // Reset search when changing channels
    setSearchQuery('');

    return () => unsubscribe();
  }, [channelId]);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-gray-200 rounded col-span-2"></div>
                <div className="h-2 bg-gray-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Channel Header */}
      <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white shadow-sm z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <h2 className="text-lg font-bold text-gray-900 truncate">{channel.name}</h2>
          {channel.description && (
            <>
              <span className="text-gray-300 mx-2 flex-shrink-0">|</span>
              <p className="text-sm text-gray-500 truncate max-w-md">{channel.description}</p>
            </>
          )}
        </div>
        
        {/* Search Messages */}
        <div className="relative ml-4 flex-shrink-0 w-64">
          <Search className="w-4 h-4 absolute left-3 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 text-sm rounded-md pl-9 pr-3 py-1.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white border border-transparent focus:border-gray-300 transition-colors"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <MessageList channelId={channelId} searchQuery={searchQuery} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white p-4 border-t border-gray-200">
        <MessageInput user={user} channelId={channelId} />
      </div>
    </div>
  );
}
