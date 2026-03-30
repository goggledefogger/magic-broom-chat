import { useNavigate } from 'react-router'
import { Hash, Users } from 'lucide-react'
import { useChannels } from '@/hooks/useChannels'
import { Button } from '@/components/ui/button'

export function ChannelBrowser() {
  const { channels, joinedChannels, joinChannel, loading } = useChannels()
  const navigate = useNavigate()

  const joinedIds = new Set(joinedChannels.map((m) => m.channel_id))

  async function handleJoin(channelId: string, slug: string) {
    await joinChannel(channelId)
    navigate(`/channel/${slug}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: 'var(--chat-text-muted)' }}>Loading channels...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center shrink-0 px-6 h-[49px] border-b"
        style={{ borderColor: 'var(--chat-border)' }}
      >
        <h2
          className="text-[15px] font-bold"
          style={{ color: 'var(--chat-text)' }}
        >
          Browse channels
        </h2>
      </div>

      {/* Channel grid */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar p-6"
        style={{ background: 'var(--chat-bg)' }}
      >
        {channels.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: 'var(--chat-text-muted)' }}>
              No channels yet. Create the first one!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => {
              const isJoined = joinedIds.has(channel.id)
              return (
                <div
                  key={channel.id}
                  className="rounded-lg border p-4 transition-shadow hover:shadow-md cursor-pointer"
                  style={{ borderColor: 'var(--chat-border)' }}
                  onClick={() => {
                    if (isJoined) {
                      navigate(`/channel/${channel.slug}`)
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Hash
                        className="size-4 shrink-0"
                        style={{ color: 'var(--chat-text-secondary)' }}
                      />
                      <span
                        className="font-semibold text-[15px] truncate"
                        style={{ color: 'var(--chat-text)' }}
                      >
                        {channel.name}
                      </span>
                    </div>
                    {isJoined ? (
                      <span
                        className="text-[12px] font-medium shrink-0 px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--slack-green)',
                          color: 'white',
                        }}
                      >
                        Joined
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleJoin(channel.id, channel.slug)
                        }}
                      >
                        Join
                      </Button>
                    )}
                  </div>
                  {channel.description && (
                    <p
                      className="text-[13px] line-clamp-2 mb-3"
                      style={{ color: 'var(--chat-text-secondary)' }}
                    >
                      {channel.description}
                    </p>
                  )}
                  <div
                    className="flex items-center gap-1 text-[12px]"
                    style={{ color: 'var(--chat-text-muted)' }}
                  >
                    <Users className="size-3" />
                    <span>members</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
