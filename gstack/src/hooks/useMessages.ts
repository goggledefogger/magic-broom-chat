import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Tables } from '@/lib/database.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Message = Tables<'messages'>
type Profile = Tables<'profiles'>

export type MessageWithProfile = Message & {
  profiles: Profile | null
  pending?: boolean
  failed?: boolean
  localId?: string
}

const PAGE_SIZE = 50

export function useMessages(channelId: string | undefined) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch initial messages
  useEffect(() => {
    if (!channelId) return

    setMessages([])
    setLoading(true)
    setHasMore(true)

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles!messages_user_id_fkey(*)')
        .eq('channel_id', channelId!)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (!error && data) {
        setMessages(data.reverse() as MessageWithProfile[])
        setHasMore(data.length === PAGE_SIZE)
      }
      setLoading(false)
    }

    fetchMessages()
  }, [channelId])

  // Real-time subscription — MUST subscribe BEFORE any sends
  useEffect(() => {
    if (!channelId) return

    const channel = supabase.channel(`room:${channelId}:messages`)

    channel
      .on('broadcast', { event: 'INSERT' }, async (payload) => {
        const newMsg = payload.payload as Message

        // Fetch full message with profile
        const { data } = await supabase
          .from('messages')
          .select('*, profiles!messages_user_id_fkey(*)')
          .eq('id', newMsg.id)
          .single()

        if (!data) return

        const fullMsg = data as MessageWithProfile

        setMessages((prev) => {
          // Deduplicate against optimistic messages: match user_id + content + pending
          const optimisticIdx = prev.findIndex(
            (m) =>
              m.pending &&
              m.user_id === fullMsg.user_id &&
              m.content === fullMsg.content,
          )

          if (optimisticIdx !== -1) {
            const updated = [...prev]
            updated[optimisticIdx] = fullMsg
            return updated
          }

          // Avoid duplicates by id
          if (prev.some((m) => m.id === fullMsg.id)) return prev

          return [...prev, fullMsg]
        })
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        const updated = payload.payload as Message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === updated.id ? { ...m, ...updated } : m,
          ),
        )
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        const deleted = payload.payload as { id: string }
        setMessages((prev) => prev.filter((m) => m.id !== deleted.id))
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [channelId])

  const loadMore = useCallback(async () => {
    if (!channelId || !hasMore || loading) return

    const oldest = messages[0]
    if (!oldest) return

    const { data } = await supabase
      .from('messages')
      .select('*, profiles!messages_user_id_fkey(*)')
      .eq('channel_id', channelId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (data) {
      setMessages((prev) => [...(data.reverse() as MessageWithProfile[]), ...prev])
      setHasMore(data.length === PAGE_SIZE)
    }
  }, [channelId, hasMore, loading, messages])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channelId || !user || !profile) return

      const localId = crypto.randomUUID()

      const optimistic: MessageWithProfile = {
        id: localId,
        channel_id: channelId,
        user_id: user.id,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parent_id: null,
        fts: null as unknown,
        profiles: profile,
        pending: true,
        localId,
      }

      setMessages((prev) => [...prev, optimistic])

      const { error } = await supabase
        .from('messages')
        .insert({ channel_id: channelId, user_id: user.id, content })

      if (error) {
        setMessages((prev) =>
          prev.map((m) =>
            m.localId === localId ? { ...m, failed: true, pending: false } : m,
          ),
        )
      }
    },
    [channelId, user, profile],
  )

  const retryMessage = useCallback(
    async (localId: string) => {
      if (!channelId || !user) return

      const msg = messages.find((m) => m.localId === localId)
      if (!msg) return

      // Reset to pending
      setMessages((prev) =>
        prev.map((m) =>
          m.localId === localId ? { ...m, failed: false, pending: true } : m,
        ),
      )

      const { error } = await supabase
        .from('messages')
        .insert({ channel_id: channelId, user_id: user.id, content: msg.content })

      if (error) {
        setMessages((prev) =>
          prev.map((m) =>
            m.localId === localId ? { ...m, failed: true, pending: false } : m,
          ),
        )
      }
    },
    [channelId, user, messages],
  )

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('id', messageId)

      if (!error) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, content: newContent, updated_at: new Date().toISOString() }
              : m,
          ),
        )
      }
    },
    [],
  )

  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
  }, [])

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
  }
}
