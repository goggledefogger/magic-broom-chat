import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/errors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Finishing your sign-in...')

  useEffect(() => {
    const errMsg =
      searchParams.get('error_description') ?? searchParams.get('error') ?? null
    if (errMsg) {
      setError(decodeURIComponent(errMsg))
      return
    }

    const run = async () => {
      const code = searchParams.get('code')
      if (code) {
        const dedupeKey = `supabase_oauth_code_${code}`
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dedupeKey)) {
          navigate('/channels', { replace: true })
          return
        }
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setError(handleSupabaseError(exchangeError))
          return
        }
        try {
          sessionStorage.setItem(dedupeKey, '1')
        } catch {
          /* ignore quota / private mode */
        }
        navigate('/channels', { replace: true })
        return
      }

      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        setError(handleSupabaseError(sessionError))
        return
      }
      if (data.session) {
        navigate('/channels', { replace: true })
        return
      }
      setStatus('Not signed in')
      setError('Could not complete sign-in. You can go back and try again.')
    }

    void run()
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Sign-in could not continue</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/login"
              className={cn(buttonVariants(), 'inline-flex w-full items-center justify-center no-underline')}
            >
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <p className="text-muted-foreground animate-pulse">{status}</p>
    </div>
  )
}
