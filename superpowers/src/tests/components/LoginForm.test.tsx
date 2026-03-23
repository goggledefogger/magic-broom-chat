import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../../components/auth/LoginForm'

describe('LoginForm', () => {
  it('renders email and password fields with submit button', () => {
    render(<LoginForm onSubmit={vi.fn()} onSwitchToSignUp={vi.fn()} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls onSubmit with email and password', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ error: null })

    render(<LoginForm onSubmit={onSubmit} onSwitchToSignUp={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(onSubmit).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('displays error message on failure', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ error: new Error('Invalid credentials') })

    render(<LoginForm onSubmit={onSubmit} onSwitchToSignUp={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
  })
})
