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

    // Best-effort profile status sync (Presence handles real-time; profiles.status is a fallback that may lag)
    supabase
      .from('profiles')
      .update({ status: 'online' })
      .eq('id', userId)
      .then(({ error }) => {
        if (error) console.warn('Failed to update profile status:', error.message)
      })

    return () => {
      // Just remove the channel — offline status update is unreliable on unmount
      // (browser close, tab close, etc.). A server-side mechanism should handle
      // marking profiles offline for reliability.
      supabase.removeChannel(channel)
    }
  }, [userId, username])

  const getStatus = useCallback((uid: string): 'online' | 'idle' | 'offline' => {
    return presenceState[uid]?.status ?? 'offline'
  }, [presenceState])

  return { presenceState, getStatus }
}
