import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  createdAt: string
  profile?: {
    displayName: string | null
    avatarUrl: string | null
  }
}

function toMessage(row: Record<string, unknown>): Message {
  const profile = row.profiles as Record<string, unknown> | null
  return {
    id: row.id as string,
    channelId: row.channel_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    profile: profile
      ? { displayName: profile.display_name as string | null, avatarUrl: profile.avatar_url as string | null }
      : undefined,
  }
}

export function useMessages(channelId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      if (!channelId) throw new Error('No channel ID')
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles!messages_user_id_profiles_fkey(display_name, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map(toMessage)
    },
    enabled: !!channelId,
  })

  // Subscribe to realtime broadcast for this channel
  useEffect(() => {
    if (!channelId) return

    const channel = supabase.channel(`room:${channelId}:messages`)
      .on('broadcast', { event: 'message_created' }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
      })
      .on('broadcast', { event: 'message_deleted' }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, queryClient])

  return query
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ channelId, userId, content }: {
      channelId: string
      userId: string
      content: string
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ channel_id: channelId, user_id: userId, content })
        .select('*, profiles!messages_user_id_profiles_fkey(display_name, avatar_url)')
        .single()
      if (error) throw error

      // Broadcast to other clients
      const channel = supabase.channel(`room:${channelId}:messages`)
      await channel.send({
        type: 'broadcast',
        event: 'message_created',
        payload: { message: data },
      })
      supabase.removeChannel(channel)

      return toMessage(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.channelId] })
      // Update last_read_at
      supabase
        .from('channel_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('channel_id', data.channelId)
        .eq('user_id', data.userId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['memberships'] })
        })
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, channelId }: { messageId: string; channelId: string }) => {
      const { error } = await supabase.from('messages').delete().eq('id', messageId)
      if (error) throw error

      const channel = supabase.channel(`room:${channelId}:messages`)
      await channel.send({
        type: 'broadcast',
        event: 'message_deleted',
        payload: { messageId },
      })
      supabase.removeChannel(channel)
    },
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
    },
  })
}
