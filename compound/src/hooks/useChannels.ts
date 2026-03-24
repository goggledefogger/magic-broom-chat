import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Tables } from '@/lib/database.types'

type Channel = Tables<'channels'>
type ChannelMember = Tables<'channel_members'>

interface ChannelWithMembership extends Channel {
  membership: ChannelMember | null
}

export function useChannels() {
  const { user } = useAuth()
  const [joinedChannels, setJoinedChannels] = useState<ChannelWithMembership[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJoinedChannels = useCallback(async () => {
    if (!user) return
    const { data: memberships } = await supabase
      .from('channel_members')
      .select('*, channels(*)')
      .eq('user_id', user.id)

    if (memberships) {
      const channels = memberships.map(m => ({
        ...(m.channels as unknown as Channel),
        membership: {
          channel_id: m.channel_id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          last_read_at: m.last_read_at,
        },
      }))
      setJoinedChannels(channels)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchJoinedChannels()
  }, [fetchJoinedChannels])

  async function fetchPublicChannels() {
    const { data } = await supabase
      .from('channels')
      .select('*')
      .eq('is_private', false)
      .order('name')
    return data ?? []
  }

  async function createChannel(name: string, description: string, isPrivate: boolean) {
    if (!user) return { error: new Error('Not authenticated') }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data, error } = await supabase
      .from('channels')
      .insert({ name, slug, description, is_private: isPrivate, created_by: user.id })
      .select()
      .single()

    if (error) return { error: new Error(error.message), channel: null }

    // Auto-join as owner
    await supabase
      .from('channel_members')
      .insert({ channel_id: data.id, user_id: user.id, role: 'owner' })

    await fetchJoinedChannels()
    return { error: null, channel: data }
  }

  async function joinChannel(channelId: string) {
    if (!user) return
    await supabase
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: user.id, role: 'member' })
    await fetchJoinedChannels()
  }

  async function leaveChannel(channelId: string) {
    if (!user) return
    await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
    await fetchJoinedChannels()
  }

  async function inviteMember(channelId: string, userId: string) {
    const { error } = await supabase
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: userId, role: 'member' })
    if (error) return { error: new Error(error.message) }
    return { error: null }
  }

  async function updateLastRead(channelId: string) {
    if (!user) return
    await supabase
      .from('channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
  }

  return {
    joinedChannels,
    loading,
    fetchPublicChannels,
    createChannel,
    joinChannel,
    leaveChannel,
    inviteMember,
    updateLastRead,
    refetch: fetchJoinedChannels,
  }
}
