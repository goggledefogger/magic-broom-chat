import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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

    // If email confirmation is required, the session will be null
    if (data?.session) {
      navigate('/channels')
    } else {
      setConfirmationSent(true)
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="auth-bg flex min-h-screen items-center justify-center p-4">
        <Card className="glass-card w-full max-w-md border-0">
          <CardHeader className="text-center">
            <div className="mb-2 text-3xl">&#x1F4DC;</div>
            <CardTitle className="font-heading text-gold text-2xl tracking-tight">Scroll Dispatched</CardTitle>
            <CardDescription className="text-muted-foreground">
              A confirmation scroll has been sent to your email. Open it to complete your apprenticeship.
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
          <div className="mb-2 text-3xl">&#x2728;</div>
          <CardTitle className="font-heading text-gold text-2xl tracking-tight">Begin Your Apprenticeship</CardTitle>
          <CardDescription className="text-muted-foreground">
            Join the workshop and learn the ways of the broom.
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
              <Label htmlFor="displayName" className="text-muted-foreground text-xs uppercase tracking-wider">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="What shall we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="border-0 bg-[#041109] focus-visible:ring-primary"
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-0 bg-[#041109] focus-visible:ring-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="btn-emerald w-full rounded-xl border-0 font-heading font-semibold" disabled={loading}>
              {loading ? 'Inscribing your name...' : 'Join the Workshop'}
            </Button>
            <Link to="/login" className="text-sm text-amber-accent hover:underline">
              Already an apprentice? Sign in
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
