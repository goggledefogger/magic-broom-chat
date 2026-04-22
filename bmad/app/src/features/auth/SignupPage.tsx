import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
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
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setAlreadyRegistered(false)
    setLoading(true)

    const { data, error: signUpError } = await signUp(email, password, displayName || undefined)

    if (signUpError) {
      setError(handleSupabaseError(signUpError))
      setLoading(false)
      return
    }

    if (data?.session) {
      navigate('/channels')
      return
    }

    // Supabase's anti-enumeration behavior: a duplicate-email signup returns 200
    // with data.user populated but identities: []. No email is sent. Detecting
    // this is the only way to tell the user their email is already registered —
    // without it, the "check your email" screen misleads them into waiting forever.
    if (data?.user && (data.user.identities?.length ?? 0) === 0) {
      setAlreadyRegistered(true)
      setLoading(false)
      return
    }

    setConfirmationSent(true)
    setLoading(false)
  }

  if (alreadyRegistered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">This apprentice is already enrolled</CardTitle>
            <CardDescription>
              <span className="font-medium">{email}</span> is already registered in the workshop.
              Sign in with your existing incantation, or reset it if you've forgotten.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Link to="/login" className={cn(buttonVariants(), 'w-full')}>
              Sign in
            </Link>
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
              Forgot your incantation?
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Scroll Dispatched</CardTitle>
            <CardDescription>
              A confirmation scroll has been sent to your email. Open it to complete your apprenticeship.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Return to the workshop entrance
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Begin Your Apprenticeship</CardTitle>
          <CardDescription>
            Join the workshop and learn the ways of the broom.
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
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="What shall we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Inscribing your name...' : 'Join the Workshop'}
            </Button>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Already an apprentice? Sign in
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
