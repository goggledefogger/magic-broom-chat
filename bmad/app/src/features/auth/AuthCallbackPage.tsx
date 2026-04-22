import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errMsg =
      searchParams.get('error_description') ?? searchParams.get('error') ?? null
    if (errMsg) {
      setError(decodeURIComponent(errMsg))
      return
    }

    // Supabase client has detectSessionInUrl: true, so it auto-exchanges the
    // code in the URL during client init and removes the PKCE verifier from
    // storage. Calling exchangeCodeForSession again here would race with that
    // and fail with "PKCE code verifier not found in storage". Instead we
    // just wait for the session to appear — same pattern ResetPasswordPage uses.
    let cancelled = false

    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) {
        navigate('/channels', { replace: true })
      }
    }
    void check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      if (session) {
        navigate('/channels', { replace: true })
      }
    })

    const timeoutId = setTimeout(() => {
      if (cancelled) return
      setError('Could not complete sign-in. You can go back and try again.')
    }, 8000)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
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
      <p className="text-muted-foreground animate-pulse">Finishing your sign-in...</p>
    </div>
  )
}
