import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChannelList } from '../../components/channels/ChannelList'

const channels = [
  { id: 'ch1', name: 'general', description: null, created_by: 'u1', created_at: '2026-01-01' },
  { id: 'ch2', name: 'random', description: 'Off-topic', created_by: 'u1', created_at: '2026-01-01' },
]

describe('ChannelList', () => {
  it('renders channel names', () => {
    render(<ChannelList channels={channels} activeChannelId={null} onSelectChannel={vi.fn()} />)

    expect(screen.getByText('general')).toBeInTheDocument()
    expect(screen.getByText('random')).toBeInTheDocument()
  })

  it('highlights the active channel', () => {
    render(<ChannelList channels={channels} activeChannelId="ch1" onSelectChannel={vi.fn()} />)

    const generalButton = screen.getByText('general').closest('button')
    expect(generalButton?.className).toContain('bg-gray-700')
  })

  it('calls onSelectChannel when clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<ChannelList channels={channels} activeChannelId={null} onSelectChannel={onSelect} />)

    await user.click(screen.getByText('random'))
    expect(onSelect).toHaveBeenCalledWith('ch2')
  })
})
