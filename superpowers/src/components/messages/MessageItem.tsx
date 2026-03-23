import { UserAvatar } from '../presence/UserAvatar'
import type { Message, Profile } from '../../lib/types'

interface MessageItemProps {
  message: Message
  author: Profile | undefined
  status: 'online' | 'idle' | 'offline'
  highlighted?: boolean
}

export function MessageItem({ message, author, status, highlighted }: MessageItemProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      id={`msg-${message.id}`}
      className={`flex gap-3 px-4 py-2 hover:bg-gray-800/50 ${highlighted ? 'bg-indigo-900/30 transition-colors duration-1000' : ''}`}
    >
      <UserAvatar username={author?.username ?? '?'} status={status} size="sm" />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-white">{author?.username ?? 'Unknown'}</span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-sm text-gray-300 break-words">{message.content}</p>
      </div>
    </div>
  )
}
