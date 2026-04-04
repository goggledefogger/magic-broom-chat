import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { handleSupabaseError } from '@/lib/errors'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(handleSupabaseError(signInError))
      setLoading(false)
    } else {
      navigate('/channels')
    }
  }

  return (
    <div className="auth-bg flex min-h-dvh items-center justify-center p-4">
      <div className="card-elevated w-full max-w-sm rounded border border-border bg-card">
        <div className="p-6 pb-2 text-center">
          <h1 className="font-heading text-4xl font-semibold text-[oklch(0.40_0.08_280)]">
            Enter the Workshop
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            The brooms await your command, apprentice.
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
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Your incantation"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 px-6 pb-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Opening the doors...' : 'Enter'}
            </Button>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/signup" className="text-muted-foreground transition-colors hover:text-primary">
                New apprentice? Sign up
              </Link>
              <Link to="/forgot-password" className="text-muted-foreground transition-colors hover:text-primary">
                Forgot password?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
