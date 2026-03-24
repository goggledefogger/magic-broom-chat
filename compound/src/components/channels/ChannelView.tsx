import { useParams } from 'react-router'
import { Hash, Lock } from 'lucide-react'
import { useChannels } from '@/hooks/useChannels'

export function ChannelView() {
  const { channelSlug } = useParams()
  const { joinedChannels } = useChannels()
  const channel = joinedChannels.find(c => c.slug === channelSlug)

  if (!channel) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p className="text-clay-400">Channel not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Channel header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b border-clay-200 bg-sand-50">
        {channel.is_private ? (
          <Lock className="h-4 w-4 text-clay-400" />
        ) : (
          <Hash className="h-4 w-4 text-clay-400" />
        )}
        <h1 className="text-sm font-semibold text-sand-800">{channel.name}</h1>
        {channel.description && (
          <span className="text-xs text-clay-400 ml-2 truncate">{channel.description}</span>
        )}
      </header>

      {/* Messages area - placeholder for Phase 5 */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-clay-400">Messages coming soon...</p>
      </div>
    </div>
  )
}
