import { ChannelItem } from './ChannelItem'
import type { Channel } from '../../lib/types'

interface ChannelListProps {
  channels: Channel[]
  activeChannelId: string | null
  onSelectChannel: (id: string) => void
}

export function ChannelList({ channels, activeChannelId, onSelectChannel }: ChannelListProps) {
  if (channels.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-gray-500">No channels yet — create one!</p>
    )
  }

  return (
    <div className="space-y-0.5">
      {channels.map((channel) => (
        <ChannelItem
          key={channel.id}
          channel={channel}
          active={channel.id === activeChannelId}
          onClick={() => onSelectChannel(channel.id)}
        />
      ))}
    </div>
  )
}
