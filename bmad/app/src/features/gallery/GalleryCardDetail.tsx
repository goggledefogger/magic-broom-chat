import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'
import { useGalleryCard, useCardComments, useCreateCardComment } from '@/hooks/useGalleryCards'
import { useCardReactions, useToggleReaction, summarizeReactions } from '@/hooks/useReactions'

const EMOJI_OPTIONS = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F389}', '\u{1F525}', '\u{1F440}', '\u{1F4A1}', '\u{2728}', '\u{1F64C}']

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function GalleryCardDetail() {
  const { channelId, cardId } = useParams<{ channelId: string; cardId: string }>()
  const { user } = useAuth()
  const { data: card, isLoading: cardLoading } = useGalleryCard(cardId)
  const { data: comments } = useCardComments(cardId)
  const createComment = useCreateCardComment()
  const { data: reactions } = useCardReactions(cardId)
  const toggleReaction = useToggleReaction()

  const [commentText, setCommentText] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const reactionSummary = reactions && user
    ? summarizeReactions(reactions, user.id)
    : []

  const handleComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !user || !cardId) return

    await createComment.mutateAsync({
      cardId,
      userId: user.id,
      content: commentText.trim(),
    })
    setCommentText('')
  }

  if (cardLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <span className="block text-2xl text-primary/30 shimmer-gold">&#10022;</span>
          <p className="text-muted-foreground">Loading card...</p>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Card not found.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-2xl p-6">
        {/* Back link */}
        <Link
          to={`/channels/${channelId}`}
          className="mb-4 inline-block text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          &larr; Back to gallery
        </Link>

        {/* Card content */}
        {card.imageUrl && (
          <div className="mb-5 overflow-hidden rounded-lg ring-1 ring-primary/10">
            <img
              src={card.imageUrl}
              alt={card.title}
              className="w-full object-contain"
            />
          </div>
        )}

        <h1 className="mb-2 font-heading text-2xl font-bold">{card.title}</h1>

        <p className="mb-2 text-sm text-muted-foreground/70">
          By {card.profile?.displayName ?? 'Unknown'} &middot;{' '}
          {formatRelativeTime(card.createdAt)}
        </p>

        {card.description && (
          <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed">{card.description}</p>
        )}

        {card.link && (
          <a
            href={card.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-block text-sm text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
          >
            View linked resource &rarr;
          </a>
        )}

        {/* Reactions */}
        <div className="mb-6 mt-4 flex flex-wrap items-center gap-2">
          {reactionSummary.map((r) => (
            <button
              key={r.emoji}
              onClick={() =>
                user && cardId && toggleReaction.mutate({ userId: user.id, emoji: r.emoji, cardId })
              }
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-all ${
                r.userReacted
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-muted/30 hover:bg-muted/60'
              }`}
            >
              <span>{r.emoji}</span>
              <span className="text-xs">{r.count}</span>
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              +
            </button>
            {showPicker && (
              <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border border-primary/20 bg-popover p-2 shadow-lg glow-gold-sm">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (user && cardId) {
                        toggleReaction.mutate({ userId: user.id, emoji, cardId })
                      }
                      setShowPicker(false)
                    }}
                    className="rounded p-1 transition-colors hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ornamental divider */}
        <div className="ornament-divider my-6">
          <span className="text-[11px] font-medium tracking-wider text-muted-foreground/50 uppercase">
            Comments
          </span>
        </div>

        {comments?.length === 0 && (
          <p className="mb-4 text-sm text-muted-foreground/60">No comments yet.</p>
        )}

        <div className="space-y-4">
          {comments?.map((comment) => {
            const authorName = comment.profile?.displayName ?? 'Unknown'
            const initials = authorName
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="mt-0.5 h-7 w-7 flex-shrink-0 ring-1 ring-border">
                  <AvatarImage src={comment.profile?.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{authorName}</span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Comment input */}
        <form onSubmit={handleComment} className="mt-6 flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[40px] resize-none"
            rows={2}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!commentText.trim() || createComment.isPending}
            className="self-end"
          >
            Post
          </Button>
        </form>
      </div>
    </ScrollArea>
  )
}
