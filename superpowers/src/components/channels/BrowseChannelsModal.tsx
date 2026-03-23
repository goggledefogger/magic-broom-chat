import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import type { Channel } from '../../lib/types'

interface BrowseChannelsModalProps {
  open: boolean
  onClose: () => void
  joinedChannelIds: Set<string>
  onJoin: (channelId: string) => Promise<{ error: any }>
  fetchAllChannels: () => Promise<{ channels: Channel[]; error: any }>
}

export function BrowseChannelsModal({ open, onClose, joinedChannelIds, onJoin, fetchAllChannels }: BrowseChannelsModalProps) {
  const [allChannels, setAllChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    async function load() {
      setLoading(true)
      const { channels } = await fetchAllChannels()
      setAllChannels(channels)
      setLoading(false)
    }

    load()
  }, [open, fetchAllChannels])

  async function handleJoin(channelId: string) {
    setJoiningId(channelId)
    await onJoin(channelId)
    setJoiningId(null)
  }

  return (
    <Modal open={open} onClose={onClose} title="Browse Channels">
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : allChannels.length === 0 ? (
        <p className="text-gray-400 text-sm py-4">No channels exist yet.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allChannels.map((ch) => (
            <div key={ch.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-700/50">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium"># {ch.name}</p>
                {ch.description && <p className="text-gray-400 text-xs truncate">{ch.description}</p>}
              </div>
              {joinedChannelIds.has(ch.id) ? (
                <span className="text-xs text-gray-500">Joined</span>
              ) : (
                <Button size="sm" onClick={() => handleJoin(ch.id)} disabled={joiningId === ch.id}>
                  {joiningId === ch.id ? '...' : 'Join'}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
