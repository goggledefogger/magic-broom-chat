import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Channel } from '../lib/types'

export function useChannels(userId: string | undefined) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChannels = useCallback(async () => {
    if (!userId) return

    const { data, error } = await supabase
      .from('channel_members')
      .select('channel_id, channels(*)')
      .eq('user_id', userId)

    if (error) {
      setError(error.message)
    } else {
      setChannels((data ?? []).map((row: any) => row.channels).filter(Boolean))
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('channel-members-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channel_members', filter: `user_id=eq.${userId}` },
        () => { fetchChannels() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchChannels])

  const createChannel = useCallback(async (name: string, description: string) => {
    if (!userId) return { error: new Error('Not authenticated') }

    const { data: channel, error: createError } = await supabase
      .from('channels')
      .insert({ name, description, created_by: userId })
      .select()
      .single()

    if (createError) return { error: createError }

    const { error: joinError } = await supabase
      .from('channel_members')
      .insert({ channel_id: channel.id, user_id: userId })

    if (joinError) return { error: joinError }

    setChannels((prev) => [...prev, channel])
    return { error: null, channel }
  }, [userId])

  const joinChannel = useCallback(async (channelId: string) => {
    if (!userId) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: userId })

    if (!error) fetchChannels()
    return { error }
  }, [userId, fetchChannels])

  const leaveChannel = useCallback(async (channelId: string) => {
    if (!userId) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId)

    if (!error) {
      setChannels((prev) => prev.filter((ch) => ch.id !== channelId))
    }
    return { error }
  }, [userId])

  return { channels, loading, error, createChannel, joinChannel, leaveChannel, refetch: fetchChannels }
}
