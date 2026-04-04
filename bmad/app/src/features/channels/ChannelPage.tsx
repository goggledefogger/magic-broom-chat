import { useEffect } from 'react'
import { useParams } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useChannel } from '@/hooks/useChannels'
import { useMarkChannelRead } from '@/hooks/useUnreadCounts'
import { ChatView } from '@/features/channels/ChatView'
import { GalleryView } from '@/features/gallery/GalleryView'

export function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const { user } = useAuth()
  const { data: channel, isLoading } = useChannel(channelId)
  const markRead = useMarkChannelRead()

  // Mark channel as read when entering
  useEffect(() => {
    if (channelId && user?.id) {
      markRead(channelId, user.id)
    }
  }, [channelId, user?.id, markRead])

  if (!channelId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a channel from the sidebar.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <span className="block text-2xl text-primary/30 shimmer-gold">&#10022;</span>
          <p className="text-sm text-muted-foreground">Loading channel...</p>
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Channel not found.</p>
      </div>
    )
  }

  if (channel.type === 'gallery') {
    return <GalleryView channelId={channelId} />
  }

  return <ChatView channelId={channelId} />
}
