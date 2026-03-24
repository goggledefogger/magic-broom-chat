import { useEffect } from 'react'
import { useParams } from 'react-router'
import { Hash, Lock } from 'lucide-react'
import { useChannels } from '@/hooks/useChannels'
import { useMessages } from '@/hooks/useMessages'
import { MessageList } from '@/components/messages/MessageList'
import { MessageInput } from '@/components/messages/MessageInput'

export function ChannelView() {
  const { channelSlug } = useParams()
  const { joinedChannels, updateLastRead } = useChannels()
  const channel = joinedChannels.find(c => c.slug === channelSlug)

  const {
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
  } = useMessages(channel?.id)

  // Update last read when viewing channel
  useEffect(() => {
    if (channel?.id) {
      updateLastRead(channel.id)
    }
  }, [channel?.id, messages.length, updateLastRead])

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

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onEdit={editMessage}
        onDelete={deleteMessage}
        onRetry={retryMessage}
      />

      {/* Input */}
      <MessageInput onSend={sendMessage} />
    </div>
  )
}
