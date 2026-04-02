import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  displayName: string | null
  avatarUrl: string | null
  role: 'student' | 'instructor'
  createdAt: string
  updatedAt: string
}

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    role: row.role as 'student' | 'instructor',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return toProfile(data)
    },
    enabled: !!userId,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      displayName,
      avatarUrl,
    }: {
      userId: string
      displayName?: string
      avatarUrl?: string
    }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (displayName !== undefined) updates.display_name = displayName
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      if (error) throw error
      return toProfile(data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', data.id], data)
    },
  })
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const filePath = `${userId}/avatar.jpeg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      return `${data.publicUrl}?t=${Date.now()}`
    },
  })
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(userId)

      if (files?.length) {
        await supabase.storage
          .from('avatars')
          .remove(files.map((f) => `${userId}/${f.name}`))
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()
      if (error) throw error
      return toProfile(data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', data.id], data)
    },
  })
}
