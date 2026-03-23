import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../lib/types'

const PAGE_SIZE = 50

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!channelId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(PAGE_SIZE)

    if (error) {
      setError(error.message)
    } else {
      setMessages(data ?? [])
    }
    setLoading(false)
  }, [channelId])

  useEffect(() => {
    setMessages([])
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (!channelId) return

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [channelId])

  const sendMessage = useCallback(async (userId: string, content: string) => {
    if (!channelId) return { error: new Error('No channel selected') }

    const { error } = await supabase
      .from('messages')
      .insert({ channel_id: channelId, user_id: userId, content })

    return { error }
  }, [channelId])

  const loadMore = useCallback(async () => {
    if (!channelId || messages.length === 0) return

    const oldest = messages[0]
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (!error && data) {
      setMessages((prev) => [...data.reverse(), ...prev])
    }
  }, [channelId, messages])

  return { messages, loading, error, sendMessage, loadMore }
}
