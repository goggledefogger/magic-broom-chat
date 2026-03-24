import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="flex items-center justify-center min-h-svh bg-sand-50 px-4">
      {isSignUp ? (
        <SignUpForm onToggle={() => setIsSignUp(false)} />
      ) : (
        <LoginForm onToggle={() => setIsSignUp(true)} />
      )}
    </div>
  )
}
