import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { handleSupabaseError } from '@/lib/errors'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await resetPassword(email)

    if (resetError) {
      setError(handleSupabaseError(resetError))
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="auth-bg flex min-h-dvh items-center justify-center p-4">
        <div className="card-elevated w-full max-w-sm rounded border border-border bg-card">
          <div className="p-6 text-center">
            <h1 className="font-heading text-4xl font-semibold text-[oklch(0.40_0.08_280)]">
              Recovery Scroll Sent
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Check your email for a link to reset your incantation.
              The magic may take a moment to arrive.
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
            Forgot Your Incantation?
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your email and we will send a recovery scroll.
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
          </div>
          <div className="flex flex-col gap-3 px-6 pb-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Preparing the scroll...' : 'Send Recovery Scroll'}
            </Button>
            <Link to="/login" className="text-center text-sm text-muted-foreground transition-colors hover:text-primary">
              Back to the workshop entrance
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
