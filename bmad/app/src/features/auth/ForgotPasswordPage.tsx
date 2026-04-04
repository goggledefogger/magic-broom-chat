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
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <div className="glass-panel max-w-md p-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Recovery Scroll Sent</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Check your email for a link to reset your incantation. The magic may take a moment to arrive.
          </p>
          <Link to="/login" className="text-sm text-accent hover:text-accent/80">
            Return to the workshop entrance
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Left panel */}
      <div className="hidden md:flex flex-1 flex-col justify-center px-12 lg:px-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(241,90,36,0.12)_0%,transparent_70%)]" />
        <div className="particle w-[3px] h-[3px] bg-primary/50 shadow-[0_0_6px_rgba(241,90,36,0.4)] top-[25%] left-[30%]" style={{ animationDelay: '0.5s' }} />
        <div className="particle w-[2px] h-[2px] bg-accent/40 shadow-[0_0_6px_rgba(45,163,203,0.3)] bottom-[30%] right-[20%]" style={{ animationDelay: '3.5s' }} />

        <div className="relative z-10">
          <h1 className="font-heading text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-3">
            Magic<br />Brooms
          </h1>
          <p className="text-accent text-sm tracking-[0.15em] uppercase">
            A Portland Career&apos;s Workshop
          </p>
          <div className="mt-4 w-10 h-0.5 bg-gradient-to-r from-primary to-transparent" />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 md:flex-none md:w-[420px] flex-col justify-center border-l border-border bg-card/50 px-8 md:px-12">
        <div className="md:hidden text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Magic Brooms</h1>
          <p className="text-accent text-xs tracking-[0.15em] uppercase mt-1">The Workshop</p>
        </div>

        <h2 className="text-lg font-medium text-foreground mb-2">Recovery Scroll</h2>
        <p className="text-sm text-muted-foreground mb-6">Enter your email and we&apos;ll send a recovery scroll.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Preparing the scroll...' : 'Send Recovery Scroll'}
          </Button>
        </form>

        <div className="mt-6 text-sm text-center">
          <Link to="/login" className="text-accent hover:text-accent/80">
            Back to the workshop entrance
          </Link>
        </div>
      </div>
    </div>
  )
}
