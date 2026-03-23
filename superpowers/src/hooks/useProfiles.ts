import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

export function useProfiles(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map())

  // Fetch own profile
  useEffect(() => {
    if (!userId) return

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data)
      })
  }, [userId])

  // Fetch all profiles (for displaying message authors)
  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .then(({ data }) => {
        if (data) {
          setProfiles(new Map(data.map((p) => [p.id, p])))
        }
      })
  }, [])

  return { profile, profiles }
}
