import { useState, useRef, useEffect, type FormEvent } from 'react'
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
import { useGalleryCard, useCardComments, useCreateCardComment, useUpdateGalleryCard, useUploadCardImage } from '@/hooks/useGalleryCards'
import { useCardReactions, useToggleReaction, summarizeReactions } from '@/hooks/useReactions'
import { handleSupabaseError } from '@/lib/errors'
import { Image as ImageIcon, X, Loader2 } from 'lucide-react'

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
  const uploadImage = useUploadCardImage()
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

  const [isUploading, setIsUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!user) return
    if (!file.type.startsWith('image/')) {
      setEditError('Please select an image file.')
      return
    }
    
    setIsUploading(true)
    setEditError(null)
    try {
      const url = await uploadImage.mutateAsync({ file, userId: user.id })
      setEditImageUrl(url)
    } catch (err) {
      setEditError(handleSupabaseError(err as { message: string }))
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    if (e.target) e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = () => {
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!editOpen) return
      
      const items = e.clipboardData?.items
      if (!items) return
      
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) handleFileUpload(file)
          break
        }
      }
    }
    
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [editOpen, user, uploadImage])

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
              <Label>Image</Label>
              <div 
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isUploading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
                    <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Uploading image...</p>
                  </div>
                )}
                
                {editImageUrl ? (
                  <div className="group relative flex max-h-48 w-full items-center justify-center overflow-hidden rounded-md bg-black/5">
                    <img src={editImageUrl} alt="Preview" className="max-h-48 object-contain" />
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      className="absolute right-2 top-2 h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setEditImageUrl('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 text-center">
                    <div className="rounded-full bg-primary/10 p-3">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-foreground">Click to upload, or drag and drop</p>
                      <p className="mt-1 text-muted-foreground">You can also paste an image from your clipboard</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      Browse Files
                    </Button>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
              <div className="mt-2">
                <Input
                  id="edit-image"
                  type="url"
                  placeholder="Or paste an image URL directly..."
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
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
