import type { Channel } from '../../lib/types'

interface ChannelItemProps {
  channel: Channel
  active: boolean
  onClick: () => void
}

export function ChannelItem({ channel, active, onClick }: ChannelItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
        active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
      }`}
    >
      <span className="text-gray-500">#</span>
      <span className="truncate">{channel.name}</span>
    </button>
  )
}
