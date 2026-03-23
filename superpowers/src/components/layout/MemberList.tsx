import { UserAvatar } from '../presence/UserAvatar'
import type { Profile } from '../../lib/types'

interface MemberListProps {
  members: Profile[]
  getStatus: (userId: string) => 'online' | 'idle' | 'offline'
}

export function MemberList({ members, getStatus }: MemberListProps) {
  const online = members.filter((m) => getStatus(m.id) === 'online')
  const offline = members.filter((m) => getStatus(m.id) !== 'online')

  return (
    <div className="p-3 overflow-y-auto h-full">
      {online.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Online — {online.length}
          </p>
          <div className="space-y-2 mb-4">
            {online.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <UserAvatar username={m.username} status="online" size="sm" avatarUrl={m.avatar_url} />
                <span className="text-sm text-gray-300 truncate">{m.username}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {offline.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Offline — {offline.length}
          </p>
          <div className="space-y-2">
            {offline.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <UserAvatar username={m.username} status={getStatus(m.id)} size="sm" avatarUrl={m.avatar_url} />
                <span className="text-sm text-gray-500 truncate">{m.username}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
