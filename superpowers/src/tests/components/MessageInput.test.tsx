import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '../../components/messages/MessageInput'

describe('MessageInput', () => {
  it('renders an input and send button', () => {
    render(<MessageInput onSend={vi.fn()} disabled={false} />)

    expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('calls onSend with message text and clears input', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn().mockResolvedValue({ error: null })

    render(<MessageInput onSend={onSend} disabled={false} />)

    const input = screen.getByPlaceholderText(/message/i)
    await user.type(input, 'Hello world')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(onSend).toHaveBeenCalledWith('Hello world')
    expect(input).toHaveValue('')
  })

  it('shows error on send failure', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn().mockResolvedValue({ error: new Error("Couldn't send — try again") })

    render(<MessageInput onSend={onSend} disabled={false} />)

    await user.type(screen.getByPlaceholderText(/message/i), 'test')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/couldn't send/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/message/i)).toHaveValue('test')
  })
})
