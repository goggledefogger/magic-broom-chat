import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { handleSupabaseError } from '@/lib/errors'

export function SignupPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signUpError } = await signUp(email, password, displayName || undefined)

    if (signUpError) {
      setError(handleSupabaseError(signUpError))
      setLoading(false)
      return
    }

    if (data?.session) {
      navigate('/channels')
    } else {
      setConfirmationSent(true)
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="auth-bg flex min-h-dvh items-center justify-center p-4">
        <div className="card-elevated w-full max-w-sm rounded border border-border bg-card">
          <div className="p-6 text-center">
            <h1 className="font-heading text-4xl font-semibold text-[oklch(0.40_0.08_280)]">
              Scroll Dispatched
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A confirmation scroll has been sent to your email. Open it to complete your apprenticeship.
            </p>
          </div>
          <div className="flex justify-center px-6 pb-6">
            <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Return to the workshop entrance
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-bg flex min-h-dvh items-center justify-center p-4">
      <div className="card-elevated w-full max-w-sm rounded border border-border bg-card">
        <div className="p-6 pb-2 text-center">
          <h1 className="font-heading text-4xl font-semibold text-[oklch(0.40_0.08_280)]">
            Begin Your Apprenticeship
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Join the workshop and learn the ways of the broom.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-4">
            {error && (
              <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="What shall we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="apprentice@workshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 px-6 pb-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Inscribing your name...' : 'Join the Workshop'}
            </Button>
            <Link to="/login" className="text-center text-sm text-muted-foreground transition-colors hover:text-primary">
              Already an apprentice? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
