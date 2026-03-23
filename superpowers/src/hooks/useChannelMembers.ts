import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

export function useChannelMembers(channelId: string | null, channelsDep: unknown) {
  const [members, setMembers] = useState<Profile[]>([])

  useEffect(() => {
    if (!channelId) return

    supabase
      .from('channel_members')
      .select('user_id, profiles(*)')
      .eq('channel_id', channelId)
      .then(({ data }) => {
        if (data) {
          setMembers(data.map((row: any) => row.profiles).filter(Boolean))
        }
      })
  }, [channelId, channelsDep])

  return members
}
