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
    <div className="auth-bg flex min-h-screen items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md border-0">
        <CardHeader className="text-center">
          <div className="mb-2 text-3xl">&#x2728;</div>
          <CardTitle className="font-heading text-gold text-2xl tracking-tight">
            Enter the Workshop
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            The brooms await your command, apprentice.
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
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your incantation"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0 bg-[#041109] focus-visible:ring-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="btn-emerald w-full rounded-xl border-0 font-heading font-semibold" disabled={loading}>
              {loading ? 'Opening the doors...' : 'Enter'}
            </Button>
            <div className="flex gap-4 text-sm">
              <Link to="/signup" className="text-amber-accent hover:underline">
                New apprentice? Sign up
              </Link>
              <Link to="/forgot-password" className="text-amber-accent hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
