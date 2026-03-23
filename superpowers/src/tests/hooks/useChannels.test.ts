import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}))

import { supabase } from '../../lib/supabase'
import { useChannels } from '../../hooks/useChannels'

describe('useChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    } as any)
  })

  it('fetches joined channels on mount', async () => {
    const mockChannels = [
      { channel_id: 'ch1', channels: { id: 'ch1', name: 'general', description: null, created_by: 'u1', created_at: '2026-01-01' } },
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: mockChannels,
          error: null,
        }),
      }),
    } as any)

    const { result } = renderHook(() => useChannels('user-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.channels).toHaveLength(1)
    expect(result.current.channels[0].name).toBe('general')
  })

  it('creates a channel and joins it', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ data: [], error: null }),
        }),
      } as any)
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'ch-new', name: 'new-channel', description: '', created_by: 'user-123', created_at: '2026-01-01' },
              error: null,
            }),
          }),
        }),
      } as any)
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any)

    const { result } = renderHook(() => useChannels('user-123'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createChannel('new-channel', '')
    })

    expect(supabase.from).toHaveBeenCalledWith('channels')
    expect(supabase.from).toHaveBeenCalledWith('channel_members')
  })
})
