import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** PostgREST `in` URL size stays safe; merge chunks if a channel ever grows huge. */
const MESSAGE_REACTION_BATCH = 200

export interface Reaction {
  id: string
  userId: string
  emoji: string
  messageId: string | null
  cardId: string | null
  createdAt: string
}

export interface ReactionSummary {
  emoji: string
  count: number
  userReacted: boolean
}

function toReaction(row: Record<string, unknown>): Reaction {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    emoji: row.emoji as string,
    messageId: row.message_id as string | null,
    cardId: row.card_id as string | null,
    createdAt: row.created_at as string,
  }
}

export function summarizeReactions(reactions: Reaction[], currentUserId: string): ReactionSummary[] {
  const map = new Map<string, { count: number; userReacted: boolean }>()
  for (const r of reactions) {
    const existing = map.get(r.emoji) ?? { count: 0, userReacted: false }
    existing.count++
    if (r.userId === currentUserId) existing.userReacted = true
    map.set(r.emoji, existing)
  }
  return Array.from(map.entries()).map(([emoji, { count, userReacted }]) => ({
    emoji,
    count,
    userReacted,
  }))
}

/** One request per chunk for all visible messages in a channel (replaces per-row fetches). */
export function useMessageReactionsForChannel(
  channelId: string | undefined,
  messageIds: string[] | undefined,
) {
  const sortedIdKey = useMemo(
    () => (messageIds?.length ? [...messageIds].sort().join('\u0001') : ''),
    [messageIds],
  )

  return useQuery({
    queryKey: ['reactions', 'messagesBatch', channelId, sortedIdKey],
    queryFn: async () => {
      if (!channelId || !messageIds?.length) return new Map<string, Reaction[]>()
      const map = new Map<string, Reaction[]>()
      for (let i = 0; i < messageIds.length; i += MESSAGE_REACTION_BATCH) {
        const chunk = messageIds.slice(i, i + MESSAGE_REACTION_BATCH)
        const { data, error } = await supabase
          .from('reactions')
          .select('*')
          .in('message_id', chunk)
        if (error) throw error
        for (const row of data ?? []) {
          const r = toReaction(row as Record<string, unknown>)
          const mid = r.messageId
          if (!mid) continue
          const list = map.get(mid) ?? []
          list.push(r)
          map.set(mid, list)
        }
      }
      return map
    },
    enabled: !!channelId && !!messageIds?.length,
  })
}

export function useCardReactions(cardId: string | undefined) {
  return useQuery({
    queryKey: ['reactions', 'card', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('No card ID')
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('card_id', cardId)
      if (error) throw error
      return (data ?? []).map(toReaction)
    },
    enabled: !!cardId,
  })
}

export function useToggleReaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, emoji, messageId, cardId }: {
      userId: string
      emoji: string
      messageId?: string
      cardId?: string
      /** When set, invalidates batched message-reaction queries for this channel. */
      channelId?: string
    }) => {
      // Check if reaction exists
      let query = supabase.from('reactions').select('id').eq('user_id', userId).eq('emoji', emoji)
      if (messageId) query = query.eq('message_id', messageId)
      if (cardId) query = query.eq('card_id', cardId)
      const { data: existing } = await query.maybeSingle()

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id)
        return { action: 'removed' as const }
      } else {
        const insert: Record<string, unknown> = { user_id: userId, emoji }
        if (messageId) insert.message_id = messageId
        if (cardId) insert.card_id = cardId
        await supabase.from('reactions').insert(insert)
        return { action: 'added' as const }
      }
    },
    onSuccess: (_, { messageId, cardId, channelId }) => {
      if (messageId && channelId) {
        queryClient.invalidateQueries({ queryKey: ['reactions', 'messagesBatch', channelId] })
      }
      if (cardId) queryClient.invalidateQueries({ queryKey: ['reactions', 'card', cardId] })
    },
  })
}
