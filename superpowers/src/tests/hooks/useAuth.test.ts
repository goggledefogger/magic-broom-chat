import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createMockSupabase } from '../setup'
import type { ReactNode } from 'react'

// We'll mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: createMockSupabase(),
}))

import { supabase } from '../../lib/supabase'
import { AuthProvider, useAuth } from '../../hooks/useAuth'
import React from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return React.createElement(AuthProvider, null, children)
}

describe('useAuth', () => {
  it('starts in loading state and resolves session', async () => {
    const mockSession = { user: { id: '123', email: 'test@example.com' } }
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession as any },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.session).toEqual(mockSession)
  })

  it('signIn calls supabase and returns result', async () => {
    const mockSession = { user: { id: '123', email: 'test@example.com' } }
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { session: mockSession as any, user: mockSession.user as any },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    let signInResult: any
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'password')
    })

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
    expect(signInResult.error).toBeNull()
  })

  it('signOut calls supabase', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signOut()
    })

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
