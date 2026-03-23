import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function MessagePane({ channel }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const prevChannelId = useRef(null);

  // Load history when channel changes
  useEffect(() => {
    if (!channel) return;
    prevChannelId.current = channel.id;

    fetch(`/api/messages/${channel.id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (prevChannelId.current === channel.id) {
          setMessages(data);
        }
      });

    socket?.emit('channel:join', channel.id);
  }, [channel?.id, socket]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handler = (msg) => {
      if (msg.channel_id === channel?.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('message:new', handler);
    return () => socket.off('message:new', handler);
  }, [socket, channel?.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('message:send', { channelId: channel.id, content: input.trim() });
    setInput('');
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5">
              {(msg.display_name || msg.username)[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-white">
                  {msg.display_name || msg.username}
                </span>
                <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
              </div>
              <p className="text-sm text-gray-300 break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message #${channel?.name || ''}`}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
