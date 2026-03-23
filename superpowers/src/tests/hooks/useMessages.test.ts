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
import { useMessages } from '../../hooks/useMessages'

describe('useMessages', () => {
  const channelSub = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue(channelSub as any)
  })

  it('fetches messages for a channel', async () => {
    const mockMessages = [
      { id: 'm1', channel_id: 'ch1', user_id: 'u1', content: 'Hello', created_at: '2026-01-01T00:00:00Z' },
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ data: mockMessages, error: null }),
          }),
        }),
      }),
    } as any)

    const { result } = renderHook(() => useMessages('ch1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].content).toBe('Hello')
  })

  it('sends a message', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ data: [], error: null }),
            }),
          }),
        }),
      } as any)
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any)

    const { result } = renderHook(() => useMessages('ch1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    let sendResult: any
    await act(async () => {
      sendResult = await result.current.sendMessage('u1', 'Hello world')
    })

    expect(sendResult.error).toBeNull()
    expect(supabase.from).toHaveBeenCalledWith('messages')
  })
})
