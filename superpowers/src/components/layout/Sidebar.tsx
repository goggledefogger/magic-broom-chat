import { UserAvatar } from '../presence/UserAvatar'
import { SearchInput } from '../search/SearchInput'
import { ChannelList } from '../channels/ChannelList'
import type { Channel, Profile } from '../../lib/types'

interface SidebarProps {
  user: Profile | null
  channels: Channel[]
  activeChannelId: string | null
  onSelectChannel: (id: string) => void
  onBrowseChannels: () => void
  onCreateChannel: () => void
  onSearch: (query: string) => void
  onSignOut: () => void
  getStatus: (userId: string) => 'online' | 'idle' | 'offline'
}

export function Sidebar({
  user,
  channels,
  activeChannelId,
  onSelectChannel,
  onBrowseChannels,
  onCreateChannel,
  onSearch,
  onSignOut,
  getStatus,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">Magic Broom Chat</h1>
      </div>

      {user && (
        <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
          <UserAvatar username={user.username} status={getStatus(user.id)} size="sm" />
          <span className="text-sm text-gray-300 truncate">{user.username}</span>
        </div>
      )}

      <div className="px-4 py-2">
        <SearchInput onSearch={onSearch} />
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-xs font-semibold text-gray-400 uppercase">Channels</span>
          <button
            onClick={onCreateChannel}
            className="text-gray-400 hover:text-white text-lg leading-none"
            aria-label="Create channel"
          >
            +
          </button>
        </div>
        <ChannelList
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={onSelectChannel}
        />
      </div>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={onBrowseChannels}
          className="w-full text-left text-sm text-gray-400 hover:text-white"
        >
          Browse channels
        </button>
        <button
          onClick={onSignOut}
          className="w-full text-left text-sm text-red-400 hover:text-red-300"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
