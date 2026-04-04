import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useChannel } from '@/hooks/useChannels'
import { useMessages, useSendMessage, useEditMessage, useDeleteMessage, type Message } from '@/hooks/useMessages'
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
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border/50 bg-muted/30 hover:bg-muted/50'
          }`}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border border-border/50 bg-popover p-1 shadow-lg">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  toggleReaction.mutate({ userId, emoji, messageId })
                  setShowPicker(false)
                }}
                className="rounded p-1 text-sm hover:bg-muted/50"
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
  const editMessage = useEditMessage()
  const deleteMessage = useDeleteMessage()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMobileToolbar, setShowMobileToolbar] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOwn = message.userId === userId
  const isEdited = message.updatedAt !== message.createdAt
  const authorName = message.profile?.displayName ?? 'Unknown Apprentice'
  const initials = authorName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const startEditing = () => {
    setEditContent(message.content)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditContent('')
  }

  const saveEdit = () => {
    const trimmed = editContent.trim()
    if (!trimmed || trimmed === message.content) {
      cancelEditing()
      return
    }
    editMessage.mutate(
      { messageId: message.id, channelId, content: trimmed },
      { onSuccess: () => setIsEditing(false) }
    )
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  useEffect(() => {
    if (isEditing) editRef.current?.focus()
  }, [isEditing])

  const showToolbar = isOwn || isInstructor

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || !showToolbar || isEditing) return
    longPressTimer.current = setTimeout(() => {
      setShowMobileToolbar(true)
    }, 500)
  }

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handlePointerCancel = handlePointerUp

  return (
    <div
      className="group relative flex gap-3 px-4 py-1.5 transition-colors hover:bg-muted/20"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerMove={handlePointerUp}
    >
      <Avatar className="mt-0.5 h-8 w-8 flex-shrink-0 ring-1 ring-border/30">
        <AvatarImage src={message.profile?.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-muted text-xs text-muted-foreground">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{authorName}</span>
          <span className="text-[11px] text-muted-foreground/60">{formatTime(message.createdAt)}</span>
          {isEdited && (
            <span className="text-[11px] text-muted-foreground/40">(edited)</span>
          )}
        </div>
        {isEditing ? (
          <div className="mt-1">
            <Textarea
              ref={editRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="min-h-[40px] max-h-[120px] resize-none text-sm"
              rows={1}
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={saveEdit}
                disabled={editMessage.isPending}
                className="text-xs text-primary hover:text-primary/80"
              >
                {editMessage.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEditing}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground/90">{message.content}</p>
        )}
        <MessageReactions messageId={message.id} userId={userId} />
      </div>

      {/* Floating toolbar - desktop hover + mobile long-press */}
      {showToolbar && !isEditing && (
        <div className={`absolute -top-3 right-4 flex items-center gap-0.5 rounded-md border border-border/50 bg-card px-1 py-0.5 shadow-sm transition-opacity ${
          showMobileToolbar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {isOwn && (
            <button
              onClick={() => { startEditing(); setShowMobileToolbar(false) }}
              className="rounded p-2.5 md:p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              title="Edit message"
            >
              <svg className="h-4 w-4 md:h-3.5 md:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          )}
          {isInstructor && (
            <button
              onClick={() => { setShowDeleteConfirm(true); setShowMobileToolbar(false) }}
              className="rounded p-2.5 md:p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Delete message"
            >
              <svg className="h-4 w-4 md:h-3.5 md:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Dismiss mobile toolbar on tap outside */}
      {showMobileToolbar && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMobileToolbar(false)} />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMessage.mutate({ messageId: message.id, channelId })
                setShowDeleteConfirm(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      {/* Channel header - hidden on mobile (mobile header in AppLayout) */}
      <div className="hidden md:flex items-center gap-3 border-b border-border/50 px-4 py-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">#{channel?.name}</h2>
          {channel?.description && (
            <p className="text-xs text-muted-foreground">{channel.description}</p>
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground/60 text-sm">
                No messages yet. Be the first to speak in this channel.
              </p>
            </div>
          )}
          {groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="date-separator">
                <span>{group.date}</span>
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
      <div className="border-t border-border/50 p-3">
        <form onSubmit={handleSubmit} className="input-glow flex gap-2 rounded-lg border border-border/50 bg-muted/30 p-1">
          <Textarea
            placeholder={`Message #${channel?.name ?? '...'}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[36px] max-h-[120px] resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
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
