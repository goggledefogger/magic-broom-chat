import { useState, type FormEvent } from 'react'

interface SignUpFormProps {
  onSubmit: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  onSwitchToLogin: () => void
}

export function SignUpForm({ onSubmit, onSwitchToLogin }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await onSubmit(email, password, username)
    if (result.error) {
      setError(result.error.message)
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label htmlFor="signup-username" className="block text-sm font-medium text-gray-300">
          Username
        </label>
        <input
          id="signup-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white px-3 py-2"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
      >
        {submitting ? 'Creating account...' : 'Sign Up'}
      </button>
      <p className="text-sm text-gray-400 text-center">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-indigo-400 hover:underline">
          Sign in
        </button>
      </p>
    </form>
  )
}
