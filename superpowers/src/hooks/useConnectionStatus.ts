import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'reconnecting'>('connected')

  useEffect(() => {
    const heartbeat = supabase.channel('heartbeat')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setStatus('reconnecting')
        }
      })

    return () => { supabase.removeChannel(heartbeat) }
  }, [])

  return status
}
