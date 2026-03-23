import { Button } from '../ui/Button'
import type { Channel } from '../../lib/types'

interface ChannelHeaderProps {
  channel: Channel
  memberCount: number
  onToggleMembers: () => void
  onLeave: () => void
}

export function ChannelHeader({ channel, memberCount, onToggleMembers, onLeave }: ChannelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-gray-500">#</span>
          {channel.name}
        </h2>
        {channel.description && (
          <p className="text-sm text-gray-400 truncate">{channel.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggleMembers}
          className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          {memberCount}
        </button>
        <Button variant="danger" size="sm" onClick={onLeave}>
          Leave
        </Button>
      </div>
    </div>
  )
}
