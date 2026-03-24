import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Tables } from '@/lib/database.types'

type Message = Tables<'messages'>
type Profile = Tables<'profiles'>

export interface MessageWithProfile extends Message {
  profiles: Profile | null
  pending?: boolean
  failed?: boolean
  localId?: string
}

const PAGE_SIZE = 50

export function useMessages(channelId: string | undefined) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!channelId) return
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (data) {
      setMessages(data.reverse() as MessageWithProfile[])
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
  }, [channelId])

  // Load older messages
  async function loadMore() {
    if (!channelId || messages.length === 0) return
    const oldest = messages[0]
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('channel_id', channelId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (data) {
      setMessages(prev => [...data.reverse() as MessageWithProfile[], ...prev])
      setHasMore(data.length === PAGE_SIZE)
    }
  }

  // Subscribe to Broadcast for real-time messages
  useEffect(() => {
    if (!channelId) return

    fetchMessages()

    const channel = supabase.channel(`room:${channelId}:messages`)

    channel
      .on('broadcast', { event: 'INSERT' }, async (payload) => {
        const newMsg = payload.payload as Record<string, unknown>
        // Fetch with profile
        const { data } = await supabase
          .from('messages')
          .select('*, profiles(*)')
          .eq('id', newMsg.id as string)
          .single()

        if (data) {
          setMessages(prev => {
            // Replace optimistic message if it exists
            const withoutOptimistic = prev.filter(
              m => !(m.localId && m.user_id === data.user_id && m.content === data.content && m.pending)
            )
            // Don't add duplicates
            if (withoutOptimistic.some(m => m.id === data.id)) return withoutOptimistic
            return [...withoutOptimistic, data as MessageWithProfile]
          })
        }
      })
      .on('broadcast', { event: 'UPDATE' }, async (payload) => {
        const updated = payload.payload as Record<string, unknown>
        const { data } = await supabase
          .from('messages')
          .select('*, profiles(*)')
          .eq('id', updated.id as string)
          .single()

        if (data) {
          setMessages(prev => prev.map(m => m.id === data.id ? data as MessageWithProfile : m))
        }
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        const deleted = payload.payload as Record<string, unknown>
        setMessages(prev => prev.filter(m => m.id !== deleted.id))
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [channelId, fetchMessages])

  // Send message with optimistic update
  async function sendMessage(content: string) {
    if (!channelId || !user) return

    const localId = crypto.randomUUID()
    const optimistic: MessageWithProfile = {
      id: localId,
      channel_id: channelId,
      user_id: user.id,
      parent_id: null,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fts: null as unknown,
      profiles: null,
      pending: true,
      localId,
    }

    setMessages(prev => [...prev, optimistic])

    const { error } = await supabase
      .from('messages')
      .insert({ channel_id: channelId, user_id: user.id, content })

    if (error) {
      setMessages(prev =>
        prev.map(m => m.localId === localId ? { ...m, pending: false, failed: true } : m)
      )
    }
  }

  // Retry failed message
  async function retryMessage(localId: string) {
    const msg = messages.find(m => m.localId === localId)
    if (!msg || !channelId || !user) return

    setMessages(prev =>
      prev.map(m => m.localId === localId ? { ...m, pending: true, failed: false } : m)
    )

    const { error } = await supabase
      .from('messages')
      .insert({ channel_id: channelId, user_id: user.id, content: msg.content })

    if (error) {
      setMessages(prev =>
        prev.map(m => m.localId === localId ? { ...m, pending: false, failed: true } : m)
      )
    }
  }

  // Edit message
  async function editMessage(messageId: string, newContent: string) {
    await supabase
      .from('messages')
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq('id', messageId)
  }

  // Delete message
  async function deleteMessage(messageId: string) {
    await supabase.from('messages').delete().eq('id', messageId)
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

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
