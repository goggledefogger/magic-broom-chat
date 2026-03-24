import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface PresenceUser {
  userId: string
  displayName: string
  avatarUrl: string | null
  onlineAt: string
}

export function usePresence() {
  const { user, profile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!user || !profile) return

    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>()
        const users: PresenceUser[] = []
        for (const [, presences] of Object.entries(state)) {
          if (presences[0]) users.push(presences[0])
        }
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
            onlineAt: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile])

  function isOnline(userId: string) {
    return onlineUsers.some(u => u.userId === userId)
  }

  return { onlineUsers, isOnline }
}
