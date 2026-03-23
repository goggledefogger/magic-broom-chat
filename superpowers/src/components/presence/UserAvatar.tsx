import { PresenceIndicator } from './PresenceIndicator'

interface UserAvatarProps {
  username: string
  status: 'online' | 'idle' | 'offline'
  size?: 'sm' | 'md'
  avatarUrl?: string | null
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
}

export function UserAvatar({ username, status, size = 'md', avatarUrl }: UserAvatarProps) {
  const initial = username.charAt(0).toUpperCase()

  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-indigo-700 flex items-center justify-center font-medium text-white`}>
          {initial}
        </div>
      )}
      <div className="absolute -bottom-0.5 -right-0.5">
        <PresenceIndicator status={status} />
      </div>
    </div>
  )
}
