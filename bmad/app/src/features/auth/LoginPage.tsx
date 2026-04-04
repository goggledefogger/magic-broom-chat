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
    <div className="flex min-h-dvh bg-background">
      {/* Left panel — brand showcase */}
      <div className="hidden md:flex flex-1 flex-col justify-center px-12 lg:px-20 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(241,90,36,0.12)_0%,transparent_70%)]" />
        {/* Constellation dots */}
        <div className="particle w-[3px] h-[3px] bg-primary/50 shadow-[0_0_6px_rgba(241,90,36,0.4)] top-[15%] left-[20%]" style={{ animationDelay: '0s' }} />
        <div className="particle w-[2px] h-[2px] bg-accent/40 shadow-[0_0_6px_rgba(45,163,203,0.3)] top-[60%] right-[25%]" style={{ animationDelay: '2s' }} />
        <div className="particle w-[2px] h-[2px] bg-secondary/50 shadow-[0_0_5px_rgba(84,84,142,0.4)] bottom-[20%] left-[35%]" style={{ animationDelay: '4s' }} />

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

      {/* Right panel — form */}
      <div className="flex flex-1 md:flex-none md:w-[420px] flex-col justify-center border-l border-border bg-card/50 px-8 md:px-12">
        {/* Mobile brand (hidden on desktop) */}
        <div className="md:hidden text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Magic Brooms</h1>
          <p className="text-accent text-xs tracking-[0.15em] uppercase mt-1">The Workshop</p>
        </div>

        <h2 className="text-lg font-medium text-foreground mb-6">Enter the Workshop</h2>

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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your incantation"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Opening the doors...' : 'Enter the Workshop'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm text-center">
          <Link to="/signup" className="text-accent hover:text-accent/80">
            New apprentice? Sign up
          </Link>
          <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">
            Forgot your incantation?
          </Link>
        </div>
      </div>
    </div>
  )
}
