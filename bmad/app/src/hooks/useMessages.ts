import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
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
    updatedAt: row.updated_at as string,
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

  // Subscribe to realtime postgres changes for this channel
  useEffect(() => {
    if (!channelId) return

    const channel = supabase.channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
        }
      )
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
      return toMessage(data)
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.channelId] })
      await supabase
        .from('channel_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('channel_id', data.channelId)
        .eq('user_id', data.userId)
      queryClient.invalidateQueries({ queryKey: ['memberships'] })
    },
  })
}

export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, content }: {
      messageId: string
      channelId: string
      content: string
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', messageId)
        .select('*, profiles!messages_user_id_profiles_fkey(display_name, avatar_url)')
        .single()
      if (error) throw error
      return toMessage(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.channelId] })
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string; channelId: string }) => {
      const { error } = await supabase.from('messages').delete().eq('id', messageId)
      if (error) throw error
    },
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
      queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
    },
  })
}
