import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useChannels } from '@/hooks/useChannels'
import { Button } from '@/components/ui/button'
import { Hash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Tables } from '@/lib/database.types'

type Channel = Tables<'channels'>

export function ChannelBrowser({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const { joinedChannels, fetchPublicChannels, joinChannel } = useChannels()
  const [publicChannels, setPublicChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchPublicChannels().then(setPublicChannels)
    }
  }, [open, fetchPublicChannels])

  const joinedIds = new Set(joinedChannels.map(c => c.id))

  async function handleJoin(channel: Channel) {
    setLoading(true)
    await joinChannel(channel.id)
    onOpenChange(false)
    navigate(`/channels/${channel.slug}`)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sand-50 max-h-[70vh]">
        <DialogHeader>
          <DialogTitle>Browse channels</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto space-y-1">
          {publicChannels.length === 0 && (
            <p className="text-sm text-clay-400 py-4 text-center">No channels yet.</p>
          )}
          {publicChannels.map(channel => {
            const joined = joinedIds.has(channel.id)
            return (
              <div
                key={channel.id}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-sand-100"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Hash className="h-4 w-4 text-clay-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-sand-800 truncate">{channel.name}</p>
                    {channel.description && (
                      <p className="text-xs text-clay-400 truncate">{channel.description}</p>
                    )}
                  </div>
                </div>
                {joined ? (
                  <span className="text-xs text-forest-600 font-medium shrink-0">Joined</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-clay-200"
                    onClick={() => handleJoin(channel)}
                    disabled={loading}
                  >
                    Join
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
