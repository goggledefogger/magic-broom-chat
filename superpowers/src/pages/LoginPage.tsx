import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LoginForm } from '../components/auth/LoginForm'
import { SignUpForm } from '../components/auth/SignUpForm'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Magic Brooms</h1>
      {mode === 'login' ? (
        <LoginForm onSubmit={signIn} onSwitchToSignUp={() => setMode('signup')} />
      ) : (
        <SignUpForm onSubmit={signUp} onSwitchToLogin={() => setMode('login')} />
      )}
    </div>
  )
}
