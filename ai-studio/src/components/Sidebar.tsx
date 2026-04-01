import React, { useEffect, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Hash, Plus, LogOut, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface Channel {
  id: string;
  name: string;
  description?: string;
}

interface UserProfile {
  uid: string;
  displayName: string;
  status: string;
  photoURL?: string;
}

interface SidebarProps {
  user: User;
  selectedChannelId: string | null;
  onSelectChannel: (id: string) => void;
}

export default function Sidebar({ user, selectedChannelId, onSelectChannel }: SidebarProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'channels'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelData: Channel[] = [];
      snapshot.forEach((doc) => {
        channelData.push({ id: doc.id, ...doc.data() } as Channel);
      });
      setChannels(channelData);
      
      // Auto-select first channel if none selected
      if (!selectedChannelId && channelData.length > 0) {
        onSelectChannel(channelData[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'channels');
    });

    return () => unsubscribe();
  }, [selectedChannelId, onSelectChannel]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('displayName'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        userData.push({ ...doc.data() } as UserProfile);
      });
      setUsers(userData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      await addDoc(collection(db, 'channels'), {
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewChannelName('');
      setIsCreatingChannel(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'channels');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-64 bg-gray-900 text-gray-300 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          Magic Broom
        </h1>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 text-sm rounded-md pl-9 pr-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channels</h2>
            <button 
              onClick={() => setIsCreatingChannel(true)}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors"
              title="Create Channel"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isCreatingChannel && (
            <form onSubmit={handleCreateChannel} className="mb-2 px-2">
              <input
                type="text"
                autoFocus
                placeholder="channel-name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onBlur={() => setIsCreatingChannel(false)}
                className="w-full bg-gray-800 text-sm rounded px-2 py-1 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </form>
          )}

          <ul className="space-y-0.5">
            {filteredChannels.map(channel => (
              <li key={channel.id}>
                <button
                  onClick={() => onSelectChannel(channel.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    selectedChannelId === channel.id 
                      ? "bg-blue-600 text-white" 
                      : "hover:bg-gray-800 text-gray-400 hover:text-gray-200"
                  )}
                >
                  <Hash className="w-4 h-4 opacity-70" />
                  <span className="truncate">{channel.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Users Presence */}
        <div className="px-3 py-4 mt-4 border-t border-gray-800">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Direct Messages</h2>
          <ul className="space-y-1">
            {users.map(u => (
              <li key={u.uid} className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-400">
                <div className="relative">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    u.status === 'online' ? "bg-green-500" : 
                    u.status === 'idle' ? "bg-yellow-500" : "bg-gray-500"
                  )} />
                </div>
                <span className="truncate">{u.displayName}</span>
                {u.uid === user.uid && <span className="text-xs text-gray-600 ml-auto">(you)</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              user.displayName?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="truncate min-w-0">
            <div className="text-sm font-medium text-white truncate">{user.displayName}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
