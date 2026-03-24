import { useEffect, useRef } from 'react'
import { MessageItem } from './MessageItem'
import type { MessageWithProfile } from '@/hooks/useMessages'
import { Button } from '@/components/ui/button'

export function MessageList({
  messages,
  loading,
  hasMore,
  onLoadMore,
  onEdit,
  onDelete,
  onRetry,
}: {
  messages: MessageWithProfile[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onRetry: (localId: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(messages.length)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      const container = containerRef.current
      if (container) {
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 100
        if (isNearBottom) {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView()
    }
  }, [loading, channelKey(messages)])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-clay-400">Loading messages...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button variant="ghost" size="sm" className="text-xs text-clay-400" onClick={onLoadMore}>
            Load older messages
          </Button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-clay-400 text-sm">No messages yet. Say something!</p>
        </div>
      )}

      {messages.map(msg => (
        <MessageItem
          key={msg.localId ?? msg.id}
          message={msg}
          onEdit={onEdit}
          onDelete={onDelete}
          onRetry={onRetry}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

// Stable key for initial scroll effect — changes when channel changes
function channelKey(messages: MessageWithProfile[]) {
  return messages[0]?.channel_id ?? 'empty'
}
