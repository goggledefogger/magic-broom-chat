import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface PresenceState {
  [userId: string]: { username: string; status: 'online' | 'idle' | 'offline' }
}

export function usePresence(userId: string | undefined, username: string | undefined) {
  const [presenceState, setPresenceState] = useState<PresenceState>({})

  useEffect(() => {
    if (!userId || !username) return

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const mapped: PresenceState = {}
        for (const [key, presences] of Object.entries(state)) {
          const latest = (presences as any[])[0]
          if (latest) {
            mapped[key] = { username: latest.username, status: 'online' }
          }
        }
        setPresenceState(mapped)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ username, online_at: new Date().toISOString() })
        }
      })

    supabase
      .from('profiles')
      .update({ status: 'online' })
      .eq('id', userId)

    return () => {
      supabase
        .from('profiles')
        .update({ status: 'offline' })
        .eq('id', userId)

      supabase.removeChannel(channel)
    }
  }, [userId, username])

  const getStatus = useCallback((uid: string): 'online' | 'idle' | 'offline' => {
    return presenceState[uid]?.status ?? 'offline'
  }, [presenceState])

  return { presenceState, getStatus }
}
