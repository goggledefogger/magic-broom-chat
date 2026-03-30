import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.search).then(({ error }) => {
      if (error) {
        console.error('Auth callback error:', error.message)
        navigate('/login')
      } else {
        navigate('/')
      }
    })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--slack-aubergine)]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <p className="text-sm text-[var(--slack-text-sidebar)]">
          Completing sign in...
        </p>
      </div>
    </div>
  )
}
