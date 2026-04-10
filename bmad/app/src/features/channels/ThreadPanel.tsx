import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useThreadMessages, useSendMessage, type Message } from '@/hooks/useMessages'
import { XIcon } from 'lucide-react'

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function ThreadReplySkeleton() {
  return (
    <div aria-label="Loading replies" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 px-4 py-2">
          <Skeleton className="h-7 w-7 flex-shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className={`h-3 ${i === 1 ? 'w-5/6' : i === 2 ? 'w-3/4' : 'w-4/5'}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ThreadMessage({ message }: { message: Message }) {
  const authorName = message.profile?.displayName ?? 'Unknown Apprentice'
  const initials = authorName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex gap-3 px-4 py-2">
      <Avatar className="mt-0.5 h-7 w-7 flex-shrink-0">
        <AvatarImage src={message.profile?.avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{authorName}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>
    </div>
  )
}

export function ThreadPanel({
  parentMessage,
  channelId,
  userId,
  onClose,
}: {
  parentMessage: Message
  channelId: string
  userId: string
  onClose: () => void
}) {
  const { data: replies, isLoading } = useThreadMessages(parentMessage.id)
  const sendMessage = useSendMessage()
  const [content, setContent] = useState('')
  const viewportRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true)
  const prevLengthRef = useRef(0)

  // Track whether the user is near the bottom of the thread viewport.
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const handleScroll = () => {
      const distanceFromBottom = vp.scrollHeight - vp.scrollTop - vp.clientHeight
      wasAtBottomRef.current = distanceFromBottom < 100
    }
    vp.addEventListener('scroll', handleScroll, { passive: true })
    return () => vp.removeEventListener('scroll', handleScroll)
  }, [])

  // Snap to bottom on initial load; only auto-scroll on new replies if the
  // user was already near the bottom.
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const currentLength = replies?.length ?? 0
    const prevLength = prevLengthRef.current
    prevLengthRef.current = currentLength

    if (prevLength === 0 && currentLength > 0) {
      vp.scrollTop = vp.scrollHeight
      wasAtBottomRef.current = true
      return
    }
    if (currentLength > prevLength && wasAtBottomRef.current) {
      vp.scrollTo({ top: vp.scrollHeight, behavior: 'smooth' })
    }
  }, [replies?.length])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    sendMessage.mutate({
      channelId,
      userId,
      content: content.trim(),
      parentId: parentMessage.id,
    })
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="flex h-full w-80 flex-col border-l bg-background md:w-96">
      {/* Thread header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Thread</h3>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Parent message */}
      <div className="border-b bg-muted/20">
        <ThreadMessage message={parentMessage} />
      </div>

      <Separator />

      {/* Replies */}
      <ScrollArea className="flex-1" viewportRef={viewportRef}>
        <div className="py-2">
          {isLoading && <ThreadReplySkeleton />}
          {replies?.length === 0 && !isLoading && (
            <p className="px-4 py-4 text-center text-xs text-muted-foreground">
              No replies yet. Start the conversation.
            </p>
          )}
          {replies?.map((reply) => (
            <ThreadMessage key={reply.id} message={reply} />
          ))}
        </div>
      </ScrollArea>

      {/* Reply composer */}
      <div className="border-t p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            placeholder="Reply in thread..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[36px] max-h-[100px] resize-none text-sm"
            rows={1}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || sendMessage.isPending}
            className="self-end"
          >
            Reply
          </Button>
        </form>
      </div>
    </div>
  )
}
