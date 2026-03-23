import { useRef, useEffect, useState, useCallback } from 'react'
import { MessageItem } from './MessageItem'
import { UnreadBanner } from './UnreadBanner'
import { Spinner } from '../ui/Spinner'
import type { Message, Profile } from '../../lib/types'

interface MessageListProps {
  messages: Message[]
  profiles: Map<string, Profile>
  loading: boolean
  getStatus: (userId: string) => 'online' | 'idle' | 'offline'
  highlightedMessageId?: string | null
}

export function MessageList({ messages, profiles, loading, getStatus, highlightedMessageId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const prevLengthRef = useRef(messages.length)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setNewMessageCount(0)
  }, [])

  function handleScroll() {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50)
  }

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      if (isAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else {
        setNewMessageCount((c) => c + (messages.length - prevLengthRef.current))
      }
    }
    prevLengthRef.current = messages.length
  }, [messages.length, isAtBottom])

  useEffect(() => {
    if (highlightedMessageId) {
      document.getElementById(`msg-${highlightedMessageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedMessageId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No messages in this channel
      </div>
    )
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            author={profiles.get(msg.user_id)}
            status={getStatus(msg.user_id)}
            highlighted={msg.id === highlightedMessageId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {newMessageCount > 0 && !isAtBottom && (
        <UnreadBanner count={newMessageCount} onClick={scrollToBottom} />
      )}
    </div>
  )
}
