import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Tables } from '@/lib/database.types'

type Channel = Tables<'channels'>
type ChannelMember = Tables<'channel_members'>

export function useChannels() {
  const { user } = useAuth()
  const [channels, setChannels] = useState<Channel[]>([])
  const [joinedChannels, setJoinedChannels] = useState<ChannelMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchChannels() {
      setLoading(true)

      const [channelsResult, membersResult] = await Promise.all([
        supabase
          .from('channels')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('channel_members')
          .select('*')
          .eq('user_id', user!.id),
      ])

      if (channelsResult.data) setChannels(channelsResult.data)
      if (membersResult.data) setJoinedChannels(membersResult.data)
      setLoading(false)
    }

    fetchChannels()
  }, [user])

  const createChannel = useCallback(
    async (name: string, description: string) => {
      if (!user) return

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const { data: channel, error } = await supabase
        .from('channels')
        .insert({ name, slug, description, created_by: user.id })
        .select()
        .single()

      if (error || !channel) return

      // Auto-join the creator
      const { data: member } = await supabase
        .from('channel_members')
        .insert({ channel_id: channel.id, user_id: user.id })
        .select()
        .single()

      setChannels((prev) => [...prev, channel])
      if (member) setJoinedChannels((prev) => [...prev, member])

      return channel
    },
    [user],
  )

  const joinChannel = useCallback(
    async (channelId: string) => {
      if (!user) return

      const { data: member, error } = await supabase
        .from('channel_members')
        .insert({ channel_id: channelId, user_id: user.id })
        .select()
        .single()

      if (error || !member) return

      setJoinedChannels((prev) => [...prev, member])
      return member
    },
    [user],
  )

  return { channels, joinedChannels, loading, createChannel, joinChannel }
}
