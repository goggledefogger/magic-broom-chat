import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface PresenceState {
  userId: string
  displayName: string
  avatarUrl: string | null
  onlineAt: string
}

export function usePresence() {
  const { user, profile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([])

  useEffect(() => {
    if (!user || !profile) return

    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        const users: PresenceState[] = []

        for (const key of Object.keys(state)) {
          const presences = state[key]
          if (presences && presences.length > 0) {
            users.push(presences[0] as PresenceState)
          }
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

    // DO NOT write "offline" status — let Supabase Presence handle teardown
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile])

  const isOnline = useCallback(
    (userId: string) => onlineUsers.some((u) => u.userId === userId),
    [onlineUsers],
  )

  return { onlineUsers, isOnline }
}
