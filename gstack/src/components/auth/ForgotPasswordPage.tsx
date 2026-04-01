import { ForgotPasswordForm } from './ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--slack-aubergine)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Magic Broom Chat
          </h1>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl">
          <ForgotPasswordForm />
        </div>

        <p className="mt-6 text-center text-xs text-[var(--slack-text-sidebar)]">
          <a href="/login" className="hover:text-white transition-colors">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  )
}
