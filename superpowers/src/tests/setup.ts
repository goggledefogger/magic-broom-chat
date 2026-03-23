import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Supabase mock factory
export function createMockSupabase() {
  const authListeners: Array<(event: string, session: unknown) => void> = []

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn((callback) => {
        authListeners.push(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      _listeners: authListeners,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
      track: vi.fn(),
      presenceState: vi.fn().mockReturnValue({}),
    })),
    removeChannel: vi.fn(),
  }
}
