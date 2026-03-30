import { useParams } from 'react-router'
import { Hash, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useChannels } from '@/hooks/useChannels'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { MessageList } from '@/components/messages/MessageList'
import { MessageInput } from '@/components/messages/MessageInput'
import { TypingIndicator } from '@/components/messages/TypingIndicator'

export function ChannelView() {
  const { channelId: channelSlug } = useParams()
  const { channels } = useChannels()
  const { setOpen: setCommandOpen } = useCommandPalette()

  const channel = channels.find((ch) => ch.slug === channelSlug)
  // useMessages and useTyping need the UUID, not the slug
  const channelUUID = channel?.id

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={channelSlug}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="flex flex-col h-full"
      >
        {/* Channel header */}
        <div
          className="flex items-center justify-between shrink-0 px-4 h-[49px] border-b"
          style={{ borderColor: 'var(--chat-border)' }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash
              className="size-4 shrink-0"
              style={{ color: 'var(--chat-text-secondary)' }}
            />
            <h2
              className="text-[15px] font-bold truncate"
              style={{ color: 'var(--chat-text)' }}
            >
              {channel?.name ?? channelSlug}
            </h2>
            {channel?.description && (
              <>
                <span
                  className="mx-1.5 text-[13px]"
                  style={{ color: 'var(--chat-border)' }}
                >
                  |
                </span>
                <span
                  className="text-[13px] truncate"
                  style={{ color: 'var(--chat-text-secondary)' }}
                >
                  {channel.description}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => setCommandOpen(true)}
            className={cn(
              'shrink-0 p-1.5 rounded-md transition-colors',
              'hover:bg-[var(--chat-hover)]',
            )}
          >
            <Search
              className="size-4"
              style={{ color: 'var(--chat-text-secondary)' }}
            />
          </button>
        </div>

        {/* Messages */}
        {channelUUID ? (
          <>
            <MessageList channelId={channelUUID} />
            <TypingIndicator channelId={channelUUID} />
            <MessageInput channelId={channelUUID} channelName={channel?.name ?? channelSlug ?? ''} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: 'var(--chat-text-muted)' }} className="text-sm">Loading channel...</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
