import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,

} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { useChannel } from '@/hooks/useChannels'
import { useGalleryCards, useCreateGalleryCard } from '@/hooks/useGalleryCards'
import { handleSupabaseError } from '@/lib/errors'

export function GalleryView({ channelId }: { channelId: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: channel } = useChannel(channelId)
  const { data: cards, isLoading } = useGalleryCards(channelId)
  const createCard = useCreateGalleryCard()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLink('')
    setImageUrl('')
    setError(null)
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !user) return
    setError(null)

    try {
      await createCard.mutateAsync({
        channelId,
        userId: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        link: link.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      })
      resetForm()
      setOpen(false)
    } catch (err) {
      setError(handleSupabaseError(err as { message: string }))
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="hidden md:block">
          <h2 className="font-heading text-lg font-bold">#{channel?.name}</h2>
          {channel?.description && (
            <p className="text-sm text-muted-foreground">{channel.description}</p>
          )}
        </div>
        <span className="md:hidden text-sm font-medium text-muted-foreground">{channel?.description}</span>
        <Button size="sm" onClick={() => setOpen(true)}>New Card</Button>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Gallery Card</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="card-title">Title</Label>
                <Input
                  id="card-title"
                  placeholder="Card title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-desc">Description</Label>
                <Textarea
                  id="card-desc"
                  placeholder="Describe your creation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-link">Link (optional)</Label>
                <Input
                  id="card-link"
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-image">Image URL (optional)</Label>
                <Input
                  id="card-image"
                  type="url"
                  placeholder="https://example.com/image.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!title.trim() || createCard.isPending}>
                {createCard.isPending ? 'Creating...' : 'Create Card'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading gallery...</p>
        )}
        {cards?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No cards yet. Create the first one!
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards?.map((card, i) => (
            <Card
              key={card.id}
              className="animate-message-appear cursor-pointer transition-all hover:border-primary/30 hover:shadow-[0_0_20px_rgba(241,90,36,0.1)]"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
              onClick={() => navigate(`/channels/${channelId}/card/${card.id}`)}
            >
              {card.imageUrl && (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader className={card.imageUrl ? 'pt-3' : undefined}>
                <CardTitle className="text-base">{card.title}</CardTitle>
              </CardHeader>
              {card.description && (
                <CardContent className="pt-0">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              )}
              <CardFooter className="pt-0 text-xs text-muted-foreground">
                {card.profile?.displayName ?? 'Unknown'} &middot;{' '}
                {new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(card.createdAt))}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
