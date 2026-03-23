import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [presence, setPresence] = useState({});

  useEffect(() => {
    if (!user) return;

    const s = io({ withCredentials: true });
    setSocket(s);

    s.on('presence:update', (data) => setPresence(data));

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
    <SocketContext.Provider value={{ socket, presence }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
