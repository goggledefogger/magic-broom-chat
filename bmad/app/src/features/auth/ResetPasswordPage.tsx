import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/errors'

type LinkState = 'checking' | 'ready' | 'invalid'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [linkState, setLinkState] = useState<LinkState>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Supabase issues a PASSWORD_RECOVERY session when the emailed link lands
  // here. If there's no session at all, the link is invalid/expired.
  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      setLinkState(data.session ? 'ready' : 'invalid')
    }
    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || session) {
        setLinkState('ready')
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Your incantations do not match — try again.')
      return
    }

    setLoading(true)
    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(handleSupabaseError(updateError))
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => navigate('/', { replace: true }), 1200)
  }

  if (linkState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verifying the scroll...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (linkState === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">This scroll has faded</CardTitle>
            <CardDescription>
              Your recovery link is invalid or has expired. Request a fresh one to continue.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Link to="/forgot-password" className={cn(buttonVariants(), 'w-full')}>
              Request a new recovery scroll
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Return to the workshop entrance
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Incantation renewed</CardTitle>
            <CardDescription>Returning you to the workshop...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose a new incantation</CardTitle>
          <CardDescription>
            Pick a password at least 6 characters long. We'll sign you in immediately after.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Once more, for safety"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Rewriting the scroll...' : 'Renew Incantation'}
            </Button>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Cancel and return to the workshop entrance
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
