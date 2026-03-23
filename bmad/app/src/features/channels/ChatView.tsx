import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useChannel } from '@/hooks/useChannels'
import { useMessages, useSendMessage, useDeleteMessage, type Message } from '@/hooks/useMessages'
import { useMessageReactions, useToggleReaction, summarizeReactions } from '@/hooks/useReactions'

const EMOJI_OPTIONS = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F389}', '\u{1F525}', '\u{1F440}', '\u{1F4A1}', '\u{2728}', '\u{1F64C}']

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  }).format(date)
}

function MessageReactions({ messageId, userId }: { messageId: string; userId: string }) {
  const { data: reactions } = useMessageReactions(messageId)
  const toggleReaction = useToggleReaction()
  const [showPicker, setShowPicker] = useState(false)

  const summary = reactions ? summarizeReactions(reactions, userId) : []

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {summary.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction.mutate({ userId, emoji: r.emoji, messageId })}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            r.userReacted
              ? 'border-primary/50 bg-primary/10'
              : 'border-border bg-muted/50 hover:bg-muted'
          }`}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border bg-popover p-1 shadow-md">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  toggleReaction.mutate({ userId, emoji, messageId })
                  setShowPicker(false)
                }}
                className="rounded p-1 text-sm hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageItem({
  message,
  userId,
  isInstructor,
  channelId,
}: {
  message: Message
  userId: string
  isInstructor: boolean
  channelId: string
}) {
  const deleteMessage = useDeleteMessage()
  const authorName = message.profile?.displayName ?? 'Unknown Apprentice'
  const initials = authorName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="group flex gap-3 px-4 py-2 hover:bg-muted/30">
      <Avatar className="mt-0.5 h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.profile?.avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{authorName}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
          {isInstructor && (
            <button
              onClick={() => deleteMessage.mutate({ messageId: message.id, channelId })}
              className="ml-auto text-xs text-destructive/60 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            >
              Delete
            </button>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        <MessageReactions messageId={message.id} userId={userId} />
      </div>
    </div>
  )
}

export function ChatView({ channelId }: { channelId: string }) {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: channel } = useChannel(channelId)
  const { data: messages, isLoading } = useMessages(channelId)
  const sendMessage = useSendMessage()
  const [content, setContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isInstructor = profile?.role === 'instructor'

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !user) return

    sendMessage.mutate({
      channelId,
      userId: user.id,
      content: content.trim(),
    })
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  if (messages) {
    let currentDate = ''
    for (const msg of messages) {
      const msgDate = formatDate(msg.createdAt)
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groupedMessages.push({ date: msgDate, messages: [] })
      }
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Channel header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">#{channel?.name}</h2>
          {channel?.description && (
            <p className="text-sm text-muted-foreground">{channel.description}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="py-4">
          {isLoading && (
            <p className="px-4 text-sm text-muted-foreground">Loading messages...</p>
          )}
          {messages?.length === 0 && (
            <p className="px-4 text-sm text-muted-foreground">
              No messages yet. Be the first to speak in this channel.
            </p>
          )}
          {groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="relative my-4 flex items-center px-4">
                <Separator className="flex-1" />
                <span className="px-3 text-xs text-muted-foreground">{group.date}</span>
                <Separator className="flex-1" />
              </div>
              {group.messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  userId={user?.id ?? ''}
                  isInstructor={isInstructor}
                  channelId={channelId}
                />
              ))}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            placeholder={`Message #${channel?.name ?? '...'}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || sendMessage.isPending}
            className="self-end"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
