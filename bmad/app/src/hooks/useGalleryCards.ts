import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface GalleryCard {
  id: string
  channelId: string
  userId: string
  imageUrl: string | null
  title: string
  description: string | null
  link: string | null
  createdAt: string
  profile?: {
    displayName: string | null
    avatarUrl: string | null
  }
  reactionCounts?: Record<string, number>
}

export interface CardComment {
  id: string
  cardId: string
  userId: string
  content: string
  createdAt: string
  profile?: {
    displayName: string | null
    avatarUrl: string | null
  }
}

function toCard(row: Record<string, unknown>): GalleryCard {
  const profile = row.profiles as Record<string, unknown> | null
  return {
    id: row.id as string,
    channelId: row.channel_id as string,
    userId: row.user_id as string,
    imageUrl: row.image_url as string | null,
    title: row.title as string,
    description: row.description as string | null,
    link: row.link as string | null,
    createdAt: row.created_at as string,
    profile: profile
      ? { displayName: profile.display_name as string | null, avatarUrl: profile.avatar_url as string | null }
      : undefined,
  }
}

function toComment(row: Record<string, unknown>): CardComment {
  const profile = row.profiles as Record<string, unknown> | null
  return {
    id: row.id as string,
    cardId: row.card_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    profile: profile
      ? { displayName: profile.display_name as string | null, avatarUrl: profile.avatar_url as string | null }
      : undefined,
  }
}

export function useGalleryCards(channelId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['gallery-cards', channelId],
    queryFn: async () => {
      if (!channelId) throw new Error('No channel ID')
      const { data, error } = await supabase
        .from('gallery_cards')
        .select('*, profiles(display_name, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(toCard)
    },
    enabled: !!channelId,
  })

  useEffect(() => {
    if (!channelId) return
    const channel = supabase.channel(`room:${channelId}:cards`)
      .on('broadcast', { event: 'card_created' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gallery-cards', channelId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [channelId, queryClient])

  return query
}

export function useGalleryCard(cardId: string | undefined) {
  return useQuery({
    queryKey: ['gallery-card', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('No card ID')
      const { data, error } = await supabase
        .from('gallery_cards')
        .select('*, profiles(display_name, avatar_url)')
        .eq('id', cardId)
        .single()
      if (error) throw error
      return toCard(data)
    },
    enabled: !!cardId,
  })
}

export function useCreateGalleryCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ channelId, userId, title, description, link, imageUrl }: {
      channelId: string
      userId: string
      title: string
      description?: string
      link?: string
      imageUrl?: string
    }) => {
      const { data, error } = await supabase
        .from('gallery_cards')
        .insert({
          channel_id: channelId,
          user_id: userId,
          title,
          description,
          link,
          image_url: imageUrl,
        })
        .select('*, profiles(display_name, avatar_url)')
        .single()
      if (error) throw error

      const channel = supabase.channel(`room:${channelId}:cards`)
      await channel.send({ type: 'broadcast', event: 'card_created', payload: { card: data } })
      supabase.removeChannel(channel)

      return toCard(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gallery-cards', data.channelId] })
    },
  })
}

export function useCardComments(cardId: string | undefined) {
  return useQuery({
    queryKey: ['card-comments', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('No card ID')
      const { data, error } = await supabase
        .from('card_comments')
        .select('*, profiles(display_name, avatar_url)')
        .eq('card_id', cardId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map(toComment)
    },
    enabled: !!cardId,
  })
}

export function useCreateCardComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cardId, userId, content }: {
      cardId: string
      userId: string
      content: string
    }) => {
      const { data, error } = await supabase
        .from('card_comments')
        .insert({ card_id: cardId, user_id: userId, content })
        .select('*, profiles(display_name, avatar_url)')
        .single()
      if (error) throw error
      return toComment(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['card-comments', data.cardId] })
    },
  })
}

export function useUploadCardImage() {
  return useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('gallery-images').getPublicUrl(filePath)
      return data.publicUrl
    },
  })
}
