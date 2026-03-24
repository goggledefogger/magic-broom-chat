import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useChannels } from '@/hooks/useChannels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function CreateChannelDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const { createChannel } = useChannels()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error, channel } = await createChannel(name, description, isPrivate)
    if (error) {
      setError(error.message)
    } else if (channel) {
      onOpenChange(false)
      setName('')
      setDescription('')
      setIsPrivate(false)
      navigate(`/channels/${channel.slug}`)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sand-50">
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Name</Label>
            <Input
              id="channel-name"
              placeholder="e.g. project-updates"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-desc">Description (optional)</Label>
            <Input
              id="channel-desc"
              placeholder="What's this channel about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="rounded border-clay-300"
            />
            Make this channel private
          </label>
          {error && <p className="text-sm text-ember-600">{error}</p>}
          <Button type="submit" className="w-full bg-ember-500 hover:bg-ember-600" disabled={loading}>
            {loading ? 'Creating...' : 'Create channel'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
