import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="auth-bg flex min-h-screen items-center justify-center p-4">
        <Card className="glass-card w-full max-w-md border-0">
          <CardHeader className="text-center">
            <div className="mb-2 text-3xl">&#x1F4DC;</div>
            <CardTitle className="font-heading text-gold text-2xl tracking-tight">Recovery Scroll Sent</CardTitle>
            <CardDescription className="text-muted-foreground">
              Check your email for a link to reset your incantation.
              The magic may take a moment to arrive.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-sm text-amber-accent hover:underline">
              Return to the workshop entrance
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="auth-bg flex min-h-screen items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md border-0">
        <CardHeader className="text-center">
          <div className="mb-2 text-3xl">&#x1F50D;</div>
          <CardTitle className="font-heading text-gold text-2xl tracking-tight">Forgot Your Incantation?</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email and we will send a recovery scroll.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="apprentice@workshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-0 bg-[#041109] focus-visible:ring-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="btn-emerald w-full rounded-xl border-0 font-heading font-semibold" disabled={loading}>
              {loading ? 'Preparing the scroll...' : 'Send Recovery Scroll'}
            </Button>
            <Link to="/login" className="text-sm text-amber-accent hover:underline">
              Back to the workshop entrance
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
