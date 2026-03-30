import { useState } from 'react'
import { NavLink } from 'react-router'
import {
  ChevronDown,
  Hash,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChannels } from '@/hooks/useChannels'
import { usePresence } from '@/hooks/usePresence'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { CreateChannelDialog } from '@/components/channels/CreateChannelDialog'

export function ChannelSidebar() {
  const { channels, joinedChannels } = useChannels()
  const { onlineUsers, isOnline } = usePresence()
  const { setOpen: setCommandOpen } = useCommandPalette()
  const [channelsExpanded, setChannelsExpanded] = useState(true)
  const [dmExpanded, setDmExpanded] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  // Build list of joined channel objects
  const joinedIds = new Set(joinedChannels.map((m) => m.channel_id))
  const myChannels = channels.filter((ch) => joinedIds.has(ch.id))

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--slack-aubergine)' }}
    >
      {/* Workspace header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1
            className="text-[15px] font-bold truncate"
            style={{ color: 'var(--slack-text-sidebar-bright)' }}
          >
            Magic Broom Chat
          </h1>
        </div>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'var(--slack-text-sidebar)' }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full mr-1"
            style={{ background: 'var(--slack-green)' }}
          />
          {onlineUsers.length} online
        </p>
      </div>

      {/* Search bar */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-[13px] transition-colors"
          style={{
            background: 'rgba(255,255,255,0.12)',
            color: 'var(--slack-text-sidebar)',
          }}
        >
          <Search className="size-3.5 opacity-70" />
          <span>Search (Cmd+K)</span>
        </button>
      </div>

      {/* Scrollable channel list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
        {/* Channels section */}
        <div className="mb-3">
          <button
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className="flex items-center gap-0.5 w-full px-2 py-1 rounded-md text-[13px] font-medium transition-colors group"
            style={{ color: 'var(--slack-text-sidebar)' }}
          >
            <ChevronDown
              className={cn(
                'size-3 transition-transform',
                !channelsExpanded && '-rotate-90',
              )}
            />
            <span className="ml-0.5">Channels</span>
          </button>

          {channelsExpanded && (
            <div className="mt-0.5">
              {myChannels.map((channel) => (
                <NavLink
                  key={channel.id}
                  to={`/channel/${channel.slug}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md py-[4px] pr-[16px] pl-[24px] text-[14px] transition-colors group',
                      isActive
                        ? 'text-white font-medium'
                        : 'hover:text-white',
                    )
                  }
                  style={({ isActive }) => ({
                    color: isActive
                      ? 'var(--slack-text-sidebar-bright)'
                      : 'var(--slack-text-sidebar)',
                    background: isActive
                      ? 'var(--slack-aubergine-active)'
                      : undefined,
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Hash className="size-4 shrink-0 opacity-70" />
                      <span className="truncate">{channel.name}</span>
                      {/* Mock unread badge */}
                      {!isActive && channel.name === 'general' && (
                        <span
                          className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none text-white"
                          style={{ background: 'var(--slack-red)' }}
                        >
                          3
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Add channel button */}
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 rounded-md py-[4px] pr-[16px] pl-[24px] text-[14px] w-full transition-colors"
                style={{ color: 'var(--slack-text-sidebar)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    'var(--slack-aubergine-hover)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <Plus className="size-4 opacity-70" />
                <span>Add channel</span>
              </button>

              {/* Browse channels link */}
              <NavLink
                to="/browse"
                className="flex items-center gap-2 rounded-md py-[4px] pr-[16px] pl-[24px] text-[14px] transition-colors"
                style={({ isActive }) => ({
                  color: isActive
                    ? 'var(--slack-text-sidebar-bright)'
                    : 'var(--slack-text-sidebar)',
                  background: isActive
                    ? 'var(--slack-aubergine-active)'
                    : undefined,
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.style.background?.includes('1164A3')) {
                    e.currentTarget.style.background =
                      'var(--slack-aubergine-hover)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.style.background?.includes('1164A3')) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <Users className="size-4 opacity-70" />
                <span>Browse channels</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Direct Messages section */}
        <div>
          <button
            onClick={() => setDmExpanded(!dmExpanded)}
            className="flex items-center gap-0.5 w-full px-2 py-1 rounded-md text-[13px] font-medium transition-colors"
            style={{ color: 'var(--slack-text-sidebar)' }}
          >
            <ChevronDown
              className={cn(
                'size-3 transition-transform',
                !dmExpanded && '-rotate-90',
              )}
            />
            <span className="ml-0.5">Direct Messages</span>
          </button>

          {dmExpanded && (
            <div className="mt-0.5">
              {onlineUsers.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center gap-2 rounded-md py-[4px] pr-[16px] pl-[24px] text-[14px] cursor-pointer transition-colors"
                  style={{ color: 'var(--slack-text-sidebar)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      'var(--slack-aubergine-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <div className="relative shrink-0">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="size-5 rounded object-cover"
                      />
                    ) : (
                      <div
                        className="size-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: 'var(--slack-purple)' }}
                      >
                        {u.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Presence dot */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2"
                      style={{
                        borderColor: 'var(--slack-aubergine)',
                        background: isOnline(u.userId)
                          ? 'var(--slack-green)'
                          : 'var(--slack-text-sidebar)',
                      }}
                    />
                  </div>
                  <span className="truncate">{u.displayName}</span>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <p
                  className="text-[13px] pl-6 py-1"
                  style={{ color: 'var(--slack-text-sidebar)' }}
                >
                  No users online
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateChannelDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
