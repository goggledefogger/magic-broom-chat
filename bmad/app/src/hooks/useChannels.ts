import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Channel {
  id: string
  name: string
  description: string | null
  type: 'standard' | 'gallery'
  isArchived: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface ChannelMember {
  channelId: string
  userId: string
  lastReadAt: string | null
  joinedAt: string
}

function toChannel(row: Record<string, unknown>): Channel {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    type: row.type as 'standard' | 'gallery',
    isArchived: row.is_archived as boolean,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map(toChannel)
    },
  })
}

export function useChannel(channelId: string | undefined) {
  return useQuery({
    queryKey: ['channels', channelId],
    queryFn: async () => {
      if (!channelId) throw new Error('No channel ID')
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single()
      if (error) throw error
      return toChannel(data)
    },
    enabled: !!channelId,
  })
}

export function useMyMemberships(userId: string | undefined) {
  return useQuery({
    queryKey: ['memberships', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID')
      const { data, error } = await supabase
        .from('channel_members')
        .select('channel_id, user_id, last_read_at, joined_at')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []).map((r): ChannelMember => ({
        channelId: r.channel_id,
        userId: r.user_id,
        lastReadAt: r.last_read_at,
        joinedAt: r.joined_at,
      }))
    },
    enabled: !!userId,
  })
}

export function useCreateChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, description, type, userId }: {
      name: string
      description?: string
      type?: 'standard' | 'gallery'
      userId: string
    }) => {
      const { data: channel, error } = await supabase
        .from('channels')
        .insert({ name, description, type: type ?? 'standard', created_by: userId })
        .select()
        .single()
      if (error) throw error

      // Auto-join the creator
      await supabase
        .from('channel_members')
        .insert({ channel_id: channel.id, user_id: userId })

      return toChannel(channel)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
      queryClient.invalidateQueries({ queryKey: ['memberships'] })
    },
  })
}

export function useJoinChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ channelId, userId }: { channelId: string; userId: string }) => {
      const { error } = await supabase
        .from('channel_members')
        .insert({ channel_id: channelId, user_id: userId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] })
    },
  })
}

export function useLeaveChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ channelId, userId }: { channelId: string; userId: string }) => {
      const { error } = await supabase
        .from('channel_members')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] })
    },
  })
}

export function useUpdateChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ channelId, ...updates }: {
      channelId: string
      name?: string
      description?: string
      type?: 'standard' | 'gallery'
      isArchived?: boolean
    }) => {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.type !== undefined) dbUpdates.type = updates.type
      if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived

      const { data, error } = await supabase
        .from('channels')
        .update(dbUpdates)
        .eq('id', channelId)
        .select()
        .single()
      if (error) throw error
      return toChannel(data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['channels', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase.from('channels').delete().eq('id', channelId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}
