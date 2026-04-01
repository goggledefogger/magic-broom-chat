import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { format } from 'date-fns';

interface Message {
  id: string;
  channelId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Timestamp;
}

interface MessageListProps {
  channelId: string;
  searchQuery?: string;
}

export default function MessageList({ channelId, searchQuery = '' }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!channelId) return;

    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [channelId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, searchQuery]);

  const filteredMessages = messages.filter(msg => 
    !searchQuery || msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No messages yet. Be the first to say hello!</p>
      </div>
    );
  }

  if (filteredMessages.length === 0 && searchQuery) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No messages match your search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredMessages.map((msg, index) => {
        const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
        const msgTime = msg.createdAt ? msg.createdAt.toMillis() : Date.now();
        const prevTime = prevMsg?.createdAt ? prevMsg.createdAt.toMillis() : 0;
        
        const showHeader = index === 0 || 
          prevMsg?.authorId !== msg.authorId || 
          (msgTime - prevTime > 5 * 60 * 1000); // 5 mins

        return (
          <div key={msg.id} className={`flex gap-4 ${!showHeader ? 'mt-1' : ''}`}>
            {/* Avatar */}
            <div className="flex-shrink-0 w-10">
              {showHeader ? (
                msg.authorPhotoURL ? (
                  <img src={msg.authorPhotoURL} alt={msg.authorName} className="w-10 h-10 rounded-md object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {msg.authorName.charAt(0).toUpperCase()}
                  </div>
                )
              ) : (
                <div className="w-10 h-full flex items-center justify-center opacity-0 hover:opacity-100 text-xs text-gray-400">
                  {msg.createdAt && format(msg.createdAt.toDate(), 'HH:mm')}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {showHeader && (
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-gray-900">{msg.authorName}</span>
                  {msg.createdAt && (
                    <span className="text-xs text-gray-500">
                      {format(msg.createdAt.toDate(), 'MMM d, yyyy h:mm a')}
                    </span>
                  )}
                </div>
              )}
              <div className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                {msg.text}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
