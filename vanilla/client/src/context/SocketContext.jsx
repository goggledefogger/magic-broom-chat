import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [presence, setPresence] = useState({});
  // { [channelId]: number } — count of messages the user hasn't seen yet
  const [unreadCounts, setUnreadCounts] = useState({});
  // Ref so the message:new handler can always see the latest active channel
  const activeChannelRef = useRef(null);

  /** Called by Chat.jsx whenever the active channel changes. */
  const setActiveChannelRef = useCallback((channelId) => {
    activeChannelRef.current = channelId;
  }, []);

  /** Seed unread counts from the server-returned channel list. */
  const seedUnreadCounts = useCallback((channels) => {
    const counts = {};
    for (const ch of channels) {
      counts[ch.id] = ch.unread_count ?? 0;
    }
    setUnreadCounts(counts);
  }, []);

  /**
   * Mark a channel as fully read:
   *   1. Zero out the local counter immediately (instant UI feedback)
   *   2. Persist to the server so it survives refreshes / other devices
   */
  const markChannelRead = useCallback((channelId) => {
    if (!channelId) return;
    setUnreadCounts((prev) => ({ ...prev, [channelId]: 0 }));
    fetch(`/api/channels/${channelId}/read`, {
      method: 'POST',
      credentials: 'include',
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const s = io({ withCredentials: true });
    setSocket(s);

    s.on('presence:update', (data) => setPresence(data));

    s.on('message:new', (msg) => {
      // Only bump the count if the message is in a channel the user isn't currently viewing
      // and it wasn't sent by the current user (they obviously read their own messages)
      if (
        msg.channel_id !== activeChannelRef.current &&
        msg.user_id !== user?.id
      ) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.channel_id]: (prev[msg.channel_id] ?? 0) + 1,
        }));
      }
    });

    // Idle detection
    let idleTimer;
    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      s.emit('presence:active');
      idleTimer = setTimeout(() => s.emit('presence:idle'), 5 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    resetIdle();

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      clearTimeout(idleTimer);
      s.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{ socket, presence, unreadCounts, markChannelRead, seedUnreadCounts, setActiveChannelRef }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
