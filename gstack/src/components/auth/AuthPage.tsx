import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'

type Tab = 'login' | 'signup'

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--slack-aubergine)] px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Magic Brooms
          </h1>
          <p className="mt-2 text-sm text-[var(--slack-text-sidebar)]">
            Sign in to your workspace
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl">
          {/* Tab toggle */}
          <div className="mb-6 flex rounded-lg bg-[var(--muted)] p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                activeTab === 'login'
                  ? 'bg-white text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              Log in
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                activeTab === 'signup'
                  ? 'bg-white text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              Sign up
            </button>
          </div>

          {activeTab === 'login' ? <LoginForm /> : <SignUpForm />}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--slack-text-sidebar)]">
          A framework comparison experiment
        </p>
      </div>
    </div>
  )
}
