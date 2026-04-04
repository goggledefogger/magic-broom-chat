import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="atelier-bg flex min-h-screen items-center justify-center p-4">
      <Card className="animate-fade-in-up w-full max-w-md glow-gold ring-1 ring-primary/10">
        <CardHeader className="text-center">
          <div className="mb-2 text-3xl text-primary/60">&#10022;</div>
          <CardTitle className="font-heading text-2xl tracking-wide">Enter the Workshop</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            The brooms await your command, apprentice.
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
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Opening the doors...' : 'Enter'}
            </Button>
            <div className="flex gap-4 text-sm">
              <Link to="/signup" className="text-muted-foreground transition-colors hover:text-primary">
                New apprentice? Sign up
              </Link>
              <Link to="/forgot-password" className="text-muted-foreground transition-colors hover:text-primary">
                Forgot password?
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
