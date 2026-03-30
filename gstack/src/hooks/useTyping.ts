import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface TypingUser {
  userId: string
  displayName: string
}

const TYPING_TIMEOUT = 2000
const THROTTLE_MS = 1000

export function useTyping(channelId: string | undefined) {
  const { user, profile } = useAuth()
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastSentRef = useRef<number>(0)

  useEffect(() => {
    if (!channelId) return

    const channel = supabase.channel(`room:${channelId}:typing`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, displayName } = payload.payload as TypingUser

        setTypingUsers((prev) => {
          if (!prev.some((u) => u.userId === userId)) {
            return [...prev, { userId, displayName }]
          }
          return prev
        })

        // Clear existing timeout for this user
        const existing = timeoutsRef.current.get(userId)
        if (existing) clearTimeout(existing)

        // Auto-remove after timeout
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
          timeoutsRef.current.delete(userId)
        }, TYPING_TIMEOUT)

        timeoutsRef.current.set(userId, timeout)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      // Clean up all timeouts
      for (const timeout of timeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      timeoutsRef.current.clear()
      setTypingUsers([])
    }
  }, [channelId])

  const sendTyping = useCallback(() => {
    if (!channelId || !user || !profile) return

    const now = Date.now()
    if (now - lastSentRef.current < THROTTLE_MS) return
    lastSentRef.current = now

    supabase.channel(`room:${channelId}:typing`).send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        displayName: profile.display_name,
      },
    })
  }, [channelId, user, profile])

  return { typingUsers, sendTyping }
}
