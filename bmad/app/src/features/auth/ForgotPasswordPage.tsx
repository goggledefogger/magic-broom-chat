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
      <div className="atelier-bg flex min-h-screen items-center justify-center p-4">
        <Card className="animate-fade-in-up w-full max-w-md glow-gold ring-1 ring-primary/10">
          <CardHeader className="text-center">
            <div className="mb-2 text-3xl text-primary/60">&#9993;</div>
            <CardTitle className="font-heading text-2xl tracking-wide">Recovery Scroll Sent</CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Check your email for a link to reset your incantation.
              The magic may take a moment to arrive.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Return to the workshop entrance
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="atelier-bg flex min-h-screen items-center justify-center p-4">
      <Card className="animate-fade-in-up w-full max-w-md glow-gold ring-1 ring-primary/10">
        <CardHeader className="text-center">
          <div className="mb-2 text-3xl text-primary/60">&#10022;</div>
          <CardTitle className="font-heading text-2xl tracking-wide">Forgot Your Incantation?</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Enter your email and we will send a recovery scroll.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <p className="rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="apprentice@workshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Preparing the scroll...' : 'Send Recovery Scroll'}
            </Button>
            <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Back to the workshop entrance
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
