import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface TypingUser {
  userId: string
  displayName: string
}

const TYPING_TIMEOUT = 2000

export function useTyping(channelId: string | undefined) {
  const { user, profile } = useAuth()
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastSentRef = useRef(0)

  useEffect(() => {
    if (!channelId) return

    const channel = supabase.channel(`room:${channelId}:typing`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, displayName } = payload as TypingUser
        if (userId === user?.id) return

        setTypingUsers(prev => {
          const exists = prev.some(u => u.userId === userId)
          if (!exists) return [...prev, { userId, displayName }]
          return prev
        })

        // Clear existing timeout for this user
        const existing = timeoutsRef.current.get(userId)
        if (existing) clearTimeout(existing)

        // Set new timeout to remove typing indicator
        timeoutsRef.current.set(
          userId,
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.userId !== userId))
            timeoutsRef.current.delete(userId)
          }, TYPING_TIMEOUT)
        )
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      timeoutsRef.current.forEach(t => clearTimeout(t))
      timeoutsRef.current.clear()
      setTypingUsers([])
    }
  }, [channelId, user?.id])

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user || !profile) return
    // Throttle: don't send more than once per second
    const now = Date.now()
    if (now - lastSentRef.current < 1000) return
    lastSentRef.current = now

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, displayName: profile.display_name },
    })
  }, [user, profile])

  return { typingUsers, sendTyping }
}
