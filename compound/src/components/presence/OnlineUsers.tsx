import { usePresence } from '@/hooks/usePresence'

export function OnlineUsers() {
  const { onlineUsers } = usePresence()

  return (
    <div className="px-3 py-2">
      <p className="text-xs font-medium text-clay-400 uppercase tracking-wider mb-2">
        Online — {onlineUsers.length}
      </p>
      <div className="space-y-1">
        {onlineUsers.map(u => (
          <div key={u.userId} className="flex items-center gap-2">
            <div className="relative">
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-ember-200 text-ember-700 text-xs font-medium flex items-center justify-center">
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-forest-500 border-2 border-sand-100" />
            </div>
            <span className="text-sm text-sand-700 truncate">{u.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
