import { useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import { MessageItem } from './MessageItem'
import { Button } from '@/components/ui/button'

const messageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
}

function isGrouped(
  currentUserId: string,
  currentTime: string,
  prevUserId: string | undefined,
  prevTime: string | undefined,
): boolean {
  if (!prevUserId || !prevTime) return false
  if (currentUserId !== prevUserId) return false
  const diff = new Date(currentTime).getTime() - new Date(prevTime).getTime()
  return diff < 5 * 60 * 1000
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface MessageListProps {
  channelId: string
}

export function MessageList({ channelId }: MessageListProps) {
  const { user } = useAuth()
  const { messages, loading, hasMore, loadMore, retryMessage } = useMessages(channelId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView()
    }
  }, [loading])

  const handleRetry = useCallback(
    (localId: string) => {
      retryMessage(localId)
    },
    [retryMessage],
  )

  if (loading) {
    return <LoadingSkeleton />
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-3">💬</div>
        <p className="text-sm text-muted-foreground">
          No messages yet. Start the conversation!
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="custom-scrollbar flex flex-1 flex-col overflow-y-auto px-4"
    >
      {hasMore && (
        <div className="flex justify-center py-3">
          <Button variant="ghost" size="sm" onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}

      <div className="mt-auto" />

      <AnimatePresence initial={false}>
        {messages.map((msg, i) => {
          const prev = i > 0 ? messages[i - 1] : undefined
          const grouped = isGrouped(
            msg.user_id,
            msg.created_at,
            prev?.user_id,
            prev?.created_at,
          )
          const isOwn = msg.user_id === user?.id

          return (
            <motion.div
              key={msg.localId ?? msg.id}
              variants={messageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              layout
            >
              <MessageItem
                message={msg}
                grouped={grouped}
                isOwn={isOwn}
                onRetry={handleRetry}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>

      <div ref={bottomRef} className="h-px shrink-0" />
    </div>
  )
}
