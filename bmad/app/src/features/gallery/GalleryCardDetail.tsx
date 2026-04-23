import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { useGalleryCard, useCardComments, useCreateCardComment, useUpdateGalleryCard } from '@/hooks/useGalleryCards'
import { useCardReactions, useToggleReaction, summarizeReactions } from '@/hooks/useReactions'
import { handleSupabaseError } from '@/lib/errors'

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
  const updateCard = useUpdateGalleryCard()
  const { data: reactions } = useCardReactions(cardId)
  const toggleReaction = useToggleReaction()

  const [commentText, setCommentText] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editLink, setEditLink] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

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

  const openEditModal = () => {
    if (!card) return
    setEditTitle(card.title)
    setEditDescription(card.description || '')
    setEditLink(card.link || '')
    setEditImageUrl(card.imageUrl || '')
    setEditError(null)
    setEditOpen(true)
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !user || !card || !channelId) return
    setEditError(null)

    try {
      await updateCard.mutateAsync({
        cardId: card.id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        link: editLink.trim() || undefined,
        imageUrl: editImageUrl.trim() || undefined,
      })
      setEditOpen(false)
    } catch (err) {
      setEditError(handleSupabaseError(err as { message: string }))
    }
  }

  if (cardLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading card...</p>
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
        {/* Back link and actions */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to={`/channels/${channelId}`}
            className="inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to gallery
          </Link>
          {user?.id === card.userId && (
            <Button variant="outline" size="sm" onClick={openEditModal}>
              Edit Card
            </Button>
          )}
        </div>

        {/* Card content */}
        {card.imageUrl && (
          <div className="mb-4 overflow-hidden rounded-lg">
            <img
              src={card.imageUrl}
              alt={card.title}
              className="w-full object-contain"
            />
          </div>
        )}

        <h1 className="mb-2 text-2xl font-bold">{card.title}</h1>

        <p className="mb-2 text-sm text-muted-foreground">
          By {card.profile?.displayName ?? 'Unknown'} &middot;{' '}
          {formatRelativeTime(card.createdAt)}
        </p>

        {card.description && (
          <p className="mb-4 whitespace-pre-wrap text-sm">{card.description}</p>
        )}

        {card.link && (
          <a
            href={card.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-block text-sm text-primary underline hover:text-primary/80"
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
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                r.userReacted
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border bg-muted/50 hover:bg-muted'
              }`}
            >
              <span>{r.emoji}</span>
              <span className="text-xs">{r.count}</span>
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm text-muted-foreground hover:bg-muted"
            >
              +
            </button>
            {showPicker && (
              <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border bg-popover p-2 shadow-md">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (user && cardId) {
                        toggleReaction.mutate({ userId: user.id, emoji, cardId })
                      }
                      setShowPicker(false)
                    }}
                    className="rounded p-1 hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Comments */}
        <h2 className="mb-4 text-lg font-semibold">Comments</h2>

        {comments?.length === 0 && (
          <p className="mb-4 text-sm text-muted-foreground">No comments yet.</p>
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
                <Avatar className="mt-0.5 h-7 w-7 flex-shrink-0">
                  <AvatarImage src={comment.profile?.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gallery Card</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {editError && (
              <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Card title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                placeholder="Describe your creation..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-link">Link (optional)</Label>
              <Input
                id="edit-link"
                type="url"
                placeholder="https://..."
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Image URL (optional)</Label>
              <Input
                id="edit-image"
                type="url"
                placeholder="https://example.com/image.png"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!editTitle.trim() || updateCard.isPending}>
              {updateCard.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  )
}
