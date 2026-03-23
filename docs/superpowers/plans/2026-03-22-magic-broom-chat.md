# Magic Broom Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time channel-based chat app (Zulip-inspired MVP) with auth, presence, and search.

**Architecture:** React (Vite) talks directly to Supabase — no custom backend. Supabase handles Postgres, Auth, Realtime, and Row Level Security. Custom hooks own all Supabase logic; components are pure UI.

**Tech Stack:** React 18, Vite, TypeScript, TailwindCSS, Supabase JS v2, Vitest, React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-22-magic-broom-chat-design.md`

---

## File Map

```
superpowers/
  index.html
  package.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  .env.local                          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  supabase/
    migrations/
      001_schema.sql                  # All tables, indexes, RLS, full-text search
  src/
    main.tsx                          # React entry point
    App.tsx                           # Router: LoginPage vs ChatPage via AuthGuard
    index.css                         # Tailwind directives
    lib/
      supabase.ts                     # createClient singleton
      types.ts                        # Database types (hand-written for MVP)
    contexts/
      AuthContext.tsx                  # Auth provider + context
    hooks/
      useAuth.ts                      # signIn, signUp, signOut, session state
      useChannels.ts                  # list, create, join, leave + realtime
      useMessages.ts                  # fetch, send + realtime subscription
      usePresence.ts                  # track + listen via Supabase Presence
      useSearch.ts                    # full-text search on messages
    components/
      auth/
        LoginForm.tsx
        SignUpForm.tsx
        AuthGuard.tsx
      layout/
        AppShell.tsx                  # Three-column responsive layout
        Sidebar.tsx
        MemberList.tsx
      channels/
        ChannelList.tsx
        ChannelItem.tsx
        ChannelHeader.tsx
        CreateChannelModal.tsx
        BrowseChannelsModal.tsx
      messages/
        MessageList.tsx
        MessageItem.tsx
        MessageInput.tsx
        UnreadBanner.tsx
      presence/
        UserAvatar.tsx
        PresenceIndicator.tsx
      search/
        SearchInput.tsx
        SearchResults.tsx
      ui/
        Button.tsx
        Modal.tsx
        Spinner.tsx
        ErrorMessage.tsx
        ErrorBoundary.tsx
    pages/
      LoginPage.tsx
      ChatPage.tsx
    tests/
      setup.ts                        # Vitest setup, Supabase mock factory
      hooks/
        useAuth.test.ts
        useChannels.test.ts
        useMessages.test.ts
      components/
        LoginForm.test.tsx
        ChannelList.test.tsx
        MessageInput.test.tsx
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `superpowers/package.json`, `superpowers/vite.config.ts`, `superpowers/tsconfig.json`, `superpowers/tsconfig.app.json`, `superpowers/tsconfig.node.json`, `superpowers/tailwind.config.ts`, `superpowers/postcss.config.js`, `superpowers/index.html`, `superpowers/src/main.tsx`, `superpowers/src/App.tsx`, `superpowers/src/index.css`, `superpowers/.env.local`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd superpowers
npm create vite@latest . -- --template react-ts
```

Select React + TypeScript when prompted. If the directory isn't empty, allow overwrite.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Configure Tailwind**

Replace `src/index.css`:

```css
@import "tailwindcss";
```

Add Tailwind plugin to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `src/tests/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Create env file**

Create `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 6: Create placeholder App**

Replace `src/App.tsx`:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-3xl font-bold">Magic Broom Chat</h1>
    </div>
  )
}

export default App
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: App renders "Magic Broom Chat" with dark background at http://localhost:5173

- [ ] **Step 8: Verify tests run**

```bash
npx vitest run
```

Expected: Test suite runs (0 tests, no errors).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind + Supabase project"
```

---

## Task 2: Supabase Schema Migration

**Files:**
- Create: `superpowers/supabase/migrations/001_schema.sql`

This SQL file is applied manually via the Supabase dashboard SQL editor (or Supabase CLI if available). It creates all four tables, indexes, RLS policies, and the full-text search index.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/001_schema.sql`:

```sql
-- ============================================
-- Magic Broom Chat — Database Schema
-- ============================================

-- 1. Profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  avatar_url text,
  status text not null default 'offline' check (status in ('online', 'idle', 'offline')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 2. Channels
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.channels enable row level security;

create policy "Authenticated users can read channels"
  on public.channels for select
  to authenticated
  using (true);

create policy "Authenticated users can create channels"
  on public.channels for insert
  to authenticated
  with check (auth.uid() = created_by);

-- 3. Channel Members
create table public.channel_members (
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

alter table public.channel_members enable row level security;

create policy "Anyone can read memberships"
  on public.channel_members for select
  to authenticated
  using (true);

create policy "Users can join channels"
  on public.channel_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can leave channels"
  on public.channel_members for delete
  to authenticated
  using (auth.uid() = user_id);

-- 4. Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Users can read messages in channels they belong to
create policy "Members can read channel messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.channel_members
      where channel_members.channel_id = messages.channel_id
      and channel_members.user_id = auth.uid()
    )
  );

-- Users can send messages to channels they belong to
create policy "Members can send channel messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.channel_members
      where channel_members.channel_id = messages.channel_id
      and channel_members.user_id = auth.uid()
    )
  );

-- Indexes
create index idx_messages_channel_created
  on public.messages (channel_id, created_at);

-- Full-text search index on message content
alter table public.messages
  add column if not exists fts tsvector
  generated always as (to_tsvector('english', content)) stored;

create index idx_messages_fts on public.messages using gin (fts);

-- ============================================
-- Enable Realtime for messages and channel_members
-- ============================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.channel_members;

-- ============================================
-- Function: create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Apply migration to Supabase**

Run the SQL in the Supabase dashboard SQL editor, or if Supabase CLI is configured:

```bash
supabase db push
```

Verify: all four tables visible in Table Editor, RLS enabled on each.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema with tables, RLS policies, indexes, and full-text search"
```

---

## Task 3: Supabase Client + Types

**Files:**
- Create: `superpowers/src/lib/supabase.ts`, `superpowers/src/lib/types.ts`

- [ ] **Step 1: Create Supabase client**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Create database types**

Create `src/lib/types.ts`:

```typescript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          status: 'online' | 'idle' | 'offline'
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          status?: 'online' | 'idle' | 'offline'
        }
        Update: {
          username?: string
          avatar_url?: string | null
          status?: 'online' | 'idle' | 'offline'
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          name: string
          description?: string | null
          created_by: string
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      channel_members: {
        Row: {
          channel_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          channel_id: string
          user_id: string
        }
        Update: never
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          channel_id: string
          user_id: string
          content: string
        }
        Update: never
      }
    }
  }
}

// Convenience aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Channel = Database['public']['Tables']['channels']['Row']
export type ChannelMember = Database['public']['Tables']['channel_members']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/
git commit -m "feat: add Supabase client singleton and database types"
```

---

## Task 4: Auth Hook + Tests

**Files:**
- Create: `superpowers/src/contexts/AuthContext.tsx`, `superpowers/src/hooks/useAuth.ts`, `superpowers/src/tests/hooks/useAuth.test.ts`

- [ ] **Step 1: Create Supabase mock factory**

Create `src/tests/setup.ts` (replace existing):

```typescript
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
```

- [ ] **Step 2: Write failing tests for useAuth**

Create `src/tests/hooks/useAuth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/tests/hooks/useAuth.test.ts
```

Expected: FAIL — `useAuth` and `AuthProvider` don't exist yet.

- [ ] **Step 4: Implement AuthContext and useAuth**

Create `src/contexts/AuthContext.tsx`:

```tsx
import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
```

Create `src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useContext } from 'react'
import { createElement } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthContextType } from '../contexts/AuthContext'
import type { Session, User } from '@supabase/supabase-js'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value: AuthContextType = { session, user, loading, signIn, signUp, signOut }

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/tests/hooks/useAuth.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/contexts/ src/hooks/useAuth.ts src/tests/
git commit -m "feat: add auth context, useAuth hook with sign in/up/out, and tests"
```

---

## Task 5: Auth UI — Login and SignUp

**Files:**
- Create: `superpowers/src/components/auth/LoginForm.tsx`, `superpowers/src/components/auth/SignUpForm.tsx`, `superpowers/src/components/auth/AuthGuard.tsx`, `superpowers/src/pages/LoginPage.tsx`, `superpowers/src/tests/components/LoginForm.test.tsx`

- [ ] **Step 1: Write failing test for LoginForm**

Create `src/tests/components/LoginForm.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/components/LoginForm.test.tsx
```

Expected: FAIL — `LoginForm` doesn't exist.

- [ ] **Step 3: Implement LoginForm**

Create `src/components/auth/LoginForm.tsx`:

```tsx
import { useState, type FormEvent } from 'react'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<{ error: Error | null }>
  onSwitchToSignUp: () => void
}

export function LoginForm({ onSubmit, onSwitchToSignUp }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await onSubmit(email, password)
    if (result.error) {
      setError(result.error.message)
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white px-3 py-2"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
      >
        {submitting ? 'Signing in...' : 'Sign In'}
      </button>
      <p className="text-sm text-gray-400 text-center">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToSignUp} className="text-indigo-400 hover:underline">
          Sign up
        </button>
      </p>
    </form>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/components/LoginForm.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Implement SignUpForm**

Create `src/components/auth/SignUpForm.tsx`:

```tsx
import { useState, type FormEvent } from 'react'

interface SignUpFormProps {
  onSubmit: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  onSwitchToLogin: () => void
}

export function SignUpForm({ onSubmit, onSwitchToLogin }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await onSubmit(email, password, username)
    if (result.error) {
      setError(result.error.message)
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label htmlFor="signup-username" className="block text-sm font-medium text-gray-300">
          Username
        </label>
        <input
          id="signup-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white px-3 py-2"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
      >
        {submitting ? 'Creating account...' : 'Sign Up'}
      </button>
      <p className="text-sm text-gray-400 text-center">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-indigo-400 hover:underline">
          Sign in
        </button>
      </p>
    </form>
  )
}
```

- [ ] **Step 6: Implement AuthGuard**

Create `src/components/auth/AuthGuard.tsx`:

```tsx
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
      </div>
    )
  }

  if (!session) {
    return null // LoginPage will be shown by App router
  }

  return <>{children}</>
}
```

- [ ] **Step 7: Implement LoginPage**

Create `src/pages/LoginPage.tsx`:

```tsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LoginForm } from '../components/auth/LoginForm'
import { SignUpForm } from '../components/auth/SignUpForm'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Magic Broom Chat</h1>
      {mode === 'login' ? (
        <LoginForm onSubmit={signIn} onSwitchToSignUp={() => setMode('signup')} />
      ) : (
        <SignUpForm onSubmit={signUp} onSwitchToLogin={() => setMode('login')} />
      )}
    </div>
  )
}
```

- [ ] **Step 8: Wire up App with auth routing**

Replace `src/App.tsx`:

```tsx
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'

function AppContent() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-2xl">Welcome! Chat coming soon...</h1>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
```

- [ ] **Step 9: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/
git commit -m "feat: add auth UI with login, signup, auth guard, and app routing"
```

---

## Task 6: UI Primitives + Error Boundary

**Files:**
- Create: `superpowers/src/components/ui/Button.tsx`, `superpowers/src/components/ui/Spinner.tsx`, `superpowers/src/components/ui/Modal.tsx`, `superpowers/src/components/ui/ErrorMessage.tsx`, `superpowers/src/components/ui/ErrorBoundary.tsx`

- [ ] **Step 1: Create Button**

Create `src/components/ui/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
}

const sizes = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`font-medium rounded-md disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Create Spinner**

Create `src/components/ui/Spinner.tsx`:

```tsx
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 ${className}`} />
  )
}
```

- [ ] **Step 3: Create Modal**

Create `src/components/ui/Modal.tsx`:

```tsx
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create ErrorMessage**

Create `src/components/ui/ErrorMessage.tsx`:

```tsx
interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="text-center py-8">
      <p className="text-red-400 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-indigo-400 hover:underline text-sm"
        >
          Try again
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create ErrorBoundary**

Create `src/components/ui/ErrorBoundary.tsx`:

```tsx
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <button
            onClick={() => window.location.reload()}
            className="text-indigo-400 hover:underline"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add UI primitives (Button, Spinner, Modal, ErrorMessage, ErrorBoundary)"
```

---

## Task 7: Channels Hook + Tests

**Files:**
- Create: `superpowers/src/hooks/useChannels.ts`, `superpowers/src/tests/hooks/useChannels.test.ts`

- [ ] **Step 1: Write failing tests for useChannels**

Create `src/tests/hooks/useChannels.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const mockFrom = vi.fn()
const mockChannel = vi.fn()
const mockRemoveChannel = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}))

import { useChannels } from '../../hooks/useChannels'

describe('useChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })
  })

  it('fetches joined channels on mount', async () => {
    const mockChannels = [
      { channel_id: 'ch1', channels: { id: 'ch1', name: 'general', description: null, created_by: 'u1', created_at: '2026-01-01' } },
    ]

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: mockChannels,
          error: null,
        }),
      }),
    })

    const { result } = renderHook(() => useChannels('user-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.channels).toHaveLength(1)
    expect(result.current.channels[0].name).toBe('general')
  })

  it('creates a channel and joins it', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'ch-new', name: 'new-channel', description: '', created_by: 'user-123', created_at: '2026-01-01' },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

    const { result } = renderHook(() => useChannels('user-123'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createChannel('new-channel', '')
    })

    expect(mockFrom).toHaveBeenCalledWith('channels')
    expect(mockFrom).toHaveBeenCalledWith('channel_members')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/hooks/useChannels.test.ts
```

Expected: FAIL — `useChannels` doesn't exist.

- [ ] **Step 3: Implement useChannels**

Create `src/hooks/useChannels.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Channel } from '../lib/types'

export function useChannels(userId: string | undefined) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChannels = useCallback(async () => {
    if (!userId) return

    const { data, error } = await supabase
      .from('channel_members')
      .select('channel_id, channels(*)')
      .eq('user_id', userId)

    if (error) {
      setError(error.message)
    } else {
      setChannels((data ?? []).map((row: any) => row.channels).filter(Boolean))
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  // Realtime subscription for channel_members changes
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('channel-members-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channel_members', filter: `user_id=eq.${userId}` },
        () => { fetchChannels() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchChannels])

  const createChannel = useCallback(async (name: string, description: string) => {
    if (!userId) return { error: new Error('Not authenticated') }

    const { data: channel, error: createError } = await supabase
      .from('channels')
      .insert({ name, description, created_by: userId })
      .select()
      .single()

    if (createError) return { error: createError }

    // Auto-join the channel
    const { error: joinError } = await supabase
      .from('channel_members')
      .insert({ channel_id: channel.id, user_id: userId })

    if (joinError) return { error: joinError }

    // Optimistically add to local state (realtime will also fire)
    setChannels((prev) => [...prev, channel])
    return { error: null, channel }
  }, [userId])

  const joinChannel = useCallback(async (channelId: string) => {
    if (!userId) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: userId })

    if (!error) fetchChannels()
    return { error }
  }, [userId, fetchChannels])

  const leaveChannel = useCallback(async (channelId: string) => {
    if (!userId) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId)

    if (!error) {
      setChannels((prev) => prev.filter((ch) => ch.id !== channelId))
    }
    return { error }
  }, [userId])

  return { channels, loading, error, createChannel, joinChannel, leaveChannel, refetch: fetchChannels }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/hooks/useChannels.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useChannels.ts src/tests/hooks/useChannels.test.ts
git commit -m "feat: add useChannels hook with create, join, leave, realtime, and tests"
```

---

## Task 8: Messages Hook + Tests

**Files:**
- Create: `superpowers/src/hooks/useMessages.ts`, `superpowers/src/tests/hooks/useMessages.test.ts`

- [ ] **Step 1: Write failing tests for useMessages**

Create `src/tests/hooks/useMessages.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const mockFrom = vi.fn()
const mockChannel = vi.fn()
const mockRemoveChannel = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}))

import { useMessages } from '../../hooks/useMessages'

describe('useMessages', () => {
  const channelSub = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.mockReturnValue(channelSub)
  })

  it('fetches messages for a channel', async () => {
    const mockMessages = [
      { id: 'm1', channel_id: 'ch1', user_id: 'u1', content: 'Hello', created_at: '2026-01-01T00:00:00Z' },
    ]

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ data: mockMessages, error: null }),
          }),
        }),
      }),
    })

    const { result } = renderHook(() => useMessages('ch1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].content).toBe('Hello')
  })

  it('sends a message', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ data: [], error: null }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

    const { result } = renderHook(() => useMessages('ch1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    let sendResult: any
    await act(async () => {
      sendResult = await result.current.sendMessage('u1', 'Hello world')
    })

    expect(sendResult.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('messages')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/hooks/useMessages.test.ts
```

Expected: FAIL — `useMessages` doesn't exist.

- [ ] **Step 3: Implement useMessages**

Create `src/hooks/useMessages.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../lib/types'

const PAGE_SIZE = 50

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!channelId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(PAGE_SIZE)

    if (error) {
      setError(error.message)
    } else {
      setMessages(data ?? [])
    }
    setLoading(false)
  }, [channelId])

  useEffect(() => {
    setMessages([])
    fetchMessages()
  }, [fetchMessages])

  // Realtime subscription for new messages in this channel
  useEffect(() => {
    if (!channelId) return

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [channelId])

  const sendMessage = useCallback(async (userId: string, content: string) => {
    if (!channelId) return { error: new Error('No channel selected') }

    const { error } = await supabase
      .from('messages')
      .insert({ channel_id: channelId, user_id: userId, content })

    return { error }
  }, [channelId])

  const loadMore = useCallback(async () => {
    if (!channelId || messages.length === 0) return

    const oldest = messages[0]
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (!error && data) {
      setMessages((prev) => [...data.reverse(), ...prev])
    }
  }, [channelId, messages])

  return { messages, loading, error, sendMessage, loadMore }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/hooks/useMessages.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMessages.ts src/tests/hooks/useMessages.test.ts
git commit -m "feat: add useMessages hook with fetch, send, realtime, pagination, and tests"
```

---

## Task 9: Presence + Search Hooks

**Files:**
- Create: `superpowers/src/hooks/usePresence.ts`, `superpowers/src/hooks/useSearch.ts`

- [ ] **Step 1: Implement usePresence**

Create `src/hooks/usePresence.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface PresenceState {
  [userId: string]: { username: string; status: 'online' | 'idle' | 'offline' }
}

export function usePresence(userId: string | undefined, username: string | undefined) {
  const [presenceState, setPresenceState] = useState<PresenceState>({})

  useEffect(() => {
    if (!userId || !username) return

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const mapped: PresenceState = {}
        for (const [key, presences] of Object.entries(state)) {
          const latest = (presences as any[])[0]
          if (latest) {
            mapped[key] = { username: latest.username, status: 'online' }
          }
        }
        setPresenceState(mapped)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ username, online_at: new Date().toISOString() })
        }
      })

    // Update profiles.status to 'online'
    supabase
      .from('profiles')
      .update({ status: 'online' })
      .eq('id', userId)

    return () => {
      // Update profiles.status to 'offline' on cleanup
      supabase
        .from('profiles')
        .update({ status: 'offline' })
        .eq('id', userId)

      supabase.removeChannel(channel)
    }
  }, [userId, username])

  const getStatus = useCallback((uid: string): 'online' | 'idle' | 'offline' => {
    return presenceState[uid]?.status ?? 'offline'
  }, [presenceState])

  return { presenceState, getStatus }
}
```

- [ ] **Step 2: Implement useSearch**

Create `src/hooks/useSearch.ts`:

```typescript
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../lib/types'

interface SearchResult extends Message {
  channel_name?: string
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    // Convert user query to tsquery format
    const tsquery = query.trim().split(/\s+/).join(' & ')

    const { data, error } = await supabase
      .from('messages')
      .select('*, channels!inner(name)')
      .textSearch('fts', tsquery)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      setError(error.message)
    } else {
      setResults(
        (data ?? []).map((row: any) => ({
          ...row,
          channel_name: row.channels?.name,
        }))
      )
    }
    setLoading(false)
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, loading, error, search, clearResults }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePresence.ts src/hooks/useSearch.ts
git commit -m "feat: add usePresence (Supabase Presence + profile sync) and useSearch (full-text) hooks"
```

---

## Task 10: Layout Components — AppShell + Sidebar

**Files:**
- Create: `superpowers/src/components/layout/AppShell.tsx`, `superpowers/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Implement AppShell**

Create `src/components/layout/AppShell.tsx`:

```tsx
import { useState, type ReactNode } from 'react'
import { ErrorBoundary } from '../ui/ErrorBoundary'

interface AppShellProps {
  sidebar: ReactNode
  main: ReactNode
  memberList?: ReactNode
}

export function AppShell({ sidebar, main, memberList }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ErrorBoundary>
      <div className="h-screen flex bg-gray-900 text-white overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 flex-shrink-0
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {sidebar}
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header with hamburger */}
          <div className="lg:hidden flex items-center p-2 bg-gray-800 border-b border-gray-700">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Main + member list */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
              {main}
            </div>

            {/* Member list — visibility controlled by parent via memberList prop */}
            {memberList && (
              <aside className="w-52 bg-gray-800 border-l border-gray-700 flex-shrink-0 hidden md:block">
                {memberList}
              </aside>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
```

- [ ] **Step 2: Implement Sidebar**

Create `src/components/layout/Sidebar.tsx`:

```tsx
import { UserAvatar } from '../presence/UserAvatar'
import { SearchInput } from '../search/SearchInput'
import { ChannelList } from '../channels/ChannelList'
import type { Channel, Profile } from '../../lib/types'

interface SidebarProps {
  user: Profile | null
  channels: Channel[]
  activeChannelId: string | null
  onSelectChannel: (id: string) => void
  onBrowseChannels: () => void
  onCreateChannel: () => void
  onSearch: (query: string) => void
  onSignOut: () => void
  getStatus: (userId: string) => 'online' | 'idle' | 'offline'
}

export function Sidebar({
  user,
  channels,
  activeChannelId,
  onSelectChannel,
  onBrowseChannels,
  onCreateChannel,
  onSearch,
  onSignOut,
  getStatus,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">Magic Broom Chat</h1>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
          <UserAvatar username={user.username} status={getStatus(user.id)} size="sm" />
          <span className="text-sm text-gray-300 truncate">{user.username}</span>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-2">
        <SearchInput onSearch={onSearch} />
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-xs font-semibold text-gray-400 uppercase">Channels</span>
          <button
            onClick={onCreateChannel}
            className="text-gray-400 hover:text-white text-lg leading-none"
            aria-label="Create channel"
          >
            +
          </button>
        </div>
        <ChannelList
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={onSelectChannel}
        />
      </div>

      {/* Browse + Sign out */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={onBrowseChannels}
          className="w-full text-left text-sm text-gray-400 hover:text-white"
        >
          Browse channels
        </button>
        <button
          onClick={onSignOut}
          className="w-full text-left text-sm text-red-400 hover:text-red-300"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add AppShell (responsive three-column layout) and Sidebar components"
```

---

## Task 11: Channel Components

**Files:**
- Create: `superpowers/src/components/channels/ChannelList.tsx`, `superpowers/src/components/channels/ChannelItem.tsx`, `superpowers/src/components/channels/ChannelHeader.tsx`, `superpowers/src/components/channels/CreateChannelModal.tsx`, `superpowers/src/components/channels/BrowseChannelsModal.tsx`, `superpowers/src/tests/components/ChannelList.test.tsx`

- [ ] **Step 1: Write failing test for ChannelList**

Create `src/tests/components/ChannelList.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/components/ChannelList.test.tsx
```

Expected: FAIL — `ChannelList` doesn't exist.

- [ ] **Step 3: Implement ChannelList and ChannelItem**

Create `src/components/channels/ChannelItem.tsx`:

```tsx
import type { Channel } from '../../lib/types'

interface ChannelItemProps {
  channel: Channel
  active: boolean
  onClick: () => void
}

export function ChannelItem({ channel, active, onClick }: ChannelItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
        active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
      }`}
    >
      <span className="text-gray-500">#</span>
      <span className="truncate">{channel.name}</span>
    </button>
  )
}
```

Create `src/components/channels/ChannelList.tsx`:

```tsx
import { ChannelItem } from './ChannelItem'
import type { Channel } from '../../lib/types'

interface ChannelListProps {
  channels: Channel[]
  activeChannelId: string | null
  onSelectChannel: (id: string) => void
}

export function ChannelList({ channels, activeChannelId, onSelectChannel }: ChannelListProps) {
  if (channels.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-gray-500">No channels yet — create one!</p>
    )
  }

  return (
    <div className="space-y-0.5">
      {channels.map((channel) => (
        <ChannelItem
          key={channel.id}
          channel={channel}
          active={channel.id === activeChannelId}
          onClick={() => onSelectChannel(channel.id)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/components/ChannelList.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Implement ChannelHeader**

Create `src/components/channels/ChannelHeader.tsx`:

```tsx
import { Button } from '../ui/Button'
import type { Channel } from '../../lib/types'

interface ChannelHeaderProps {
  channel: Channel
  memberCount: number
  onToggleMembers: () => void
  onLeave: () => void
}

export function ChannelHeader({ channel, memberCount, onToggleMembers, onLeave }: ChannelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-gray-500">#</span>
          {channel.name}
        </h2>
        {channel.description && (
          <p className="text-sm text-gray-400 truncate">{channel.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggleMembers}
          className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          {memberCount}
        </button>
        <Button variant="danger" size="sm" onClick={onLeave}>
          Leave
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Implement CreateChannelModal**

Create `src/components/channels/CreateChannelModal.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface CreateChannelModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description: string) => Promise<{ error: any }>
}

export function CreateChannelModal({ open, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await onCreate(name.trim().toLowerCase().replace(/\s+/g, '-'), description.trim())
    if (result.error) {
      setError(result.error.message)
      setSubmitting(false)
    } else {
      setName('')
      setDescription('')
      setSubmitting(false)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Channel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="channel-name" className="block text-sm font-medium text-gray-300">
            Name
          </label>
          <input
            id="channel-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. general"
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="channel-desc" className="block text-sm font-medium text-gray-300">
            Description (optional)
          </label>
          <input
            id="channel-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 7: Implement BrowseChannelsModal**

Create `src/components/channels/BrowseChannelsModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { supabase } from '../../lib/supabase'
import type { Channel } from '../../lib/types'

interface BrowseChannelsModalProps {
  open: boolean
  onClose: () => void
  joinedChannelIds: Set<string>
  onJoin: (channelId: string) => Promise<{ error: any }>
}

export function BrowseChannelsModal({ open, onClose, joinedChannelIds, onJoin }: BrowseChannelsModalProps) {
  const [allChannels, setAllChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from('channels')
        .select('*')
        .order('name')

      setAllChannels(data ?? [])
      setLoading(false)
    }

    fetch()
  }, [open])

  async function handleJoin(channelId: string) {
    setJoiningId(channelId)
    await onJoin(channelId)
    setJoiningId(null)
  }

  return (
    <Modal open={open} onClose={onClose} title="Browse Channels">
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : allChannels.length === 0 ? (
        <p className="text-gray-400 text-sm py-4">No channels exist yet.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allChannels.map((ch) => (
            <div key={ch.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-700/50">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium"># {ch.name}</p>
                {ch.description && <p className="text-gray-400 text-xs truncate">{ch.description}</p>}
              </div>
              {joinedChannelIds.has(ch.id) ? (
                <span className="text-xs text-gray-500">Joined</span>
              ) : (
                <Button size="sm" onClick={() => handleJoin(ch.id)} disabled={joiningId === ch.id}>
                  {joiningId === ch.id ? '...' : 'Join'}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/channels/ src/tests/components/ChannelList.test.tsx
git commit -m "feat: add channel components (list, header, create modal, browse modal) with tests"
```

---

## Task 12: Message Components

**Files:**
- Create: `superpowers/src/components/messages/MessageList.tsx`, `superpowers/src/components/messages/MessageItem.tsx`, `superpowers/src/components/messages/MessageInput.tsx`, `superpowers/src/components/messages/UnreadBanner.tsx`, `superpowers/src/tests/components/MessageInput.test.tsx`

- [ ] **Step 1: Write failing test for MessageInput**

Create `src/tests/components/MessageInput.test.tsx`:

```tsx
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
    // Message should remain in input on failure
    expect(screen.getByPlaceholderText(/message/i)).toHaveValue('test')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/components/MessageInput.test.tsx
```

Expected: FAIL — `MessageInput` doesn't exist.

- [ ] **Step 3: Implement MessageInput**

Create `src/components/messages/MessageInput.tsx`:

```tsx
import { useState, type FormEvent } from 'react'

interface MessageInputProps {
  onSend: (content: string) => Promise<{ error: any }>
  disabled: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim() || sending) return

    setError(null)
    setSending(true)

    const result = await onSend(content.trim())
    if (result.error) {
      setError(result.error.message)
    } else {
      setContent('')
    }
    setSending(false)
  }

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4">
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-gray-700 text-white rounded-md px-3 py-2 text-sm placeholder-gray-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || sending || !content.trim()}
          aria-label="Send"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/components/MessageInput.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Implement MessageItem**

Create `src/components/messages/MessageItem.tsx`:

```tsx
import { UserAvatar } from '../presence/UserAvatar'
import type { Message, Profile } from '../../lib/types'

interface MessageItemProps {
  message: Message
  author: Profile | undefined
  status: 'online' | 'idle' | 'offline'
  highlighted?: boolean
}

export function MessageItem({ message, author, status, highlighted }: MessageItemProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      id={`msg-${message.id}`}
      className={`flex gap-3 px-4 py-2 hover:bg-gray-800/50 ${highlighted ? 'bg-indigo-900/30 transition-colors duration-1000' : ''}`}
    >
      <UserAvatar username={author?.username ?? '?'} status={status} size="sm" />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-white">{author?.username ?? 'Unknown'}</span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-sm text-gray-300 break-words">{message.content}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Implement MessageList**

Create `src/components/messages/MessageList.tsx`:

```tsx
import { useRef, useEffect, useState, useCallback } from 'react'
import { MessageItem } from './MessageItem'
import { UnreadBanner } from './UnreadBanner'
import { Spinner } from '../ui/Spinner'
import type { Message, Profile } from '../../lib/types'

interface MessageListProps {
  messages: Message[]
  profiles: Map<string, Profile>
  loading: boolean
  getStatus: (userId: string) => 'online' | 'idle' | 'offline'
  highlightedMessageId?: string | null
}

export function MessageList({ messages, profiles, loading, getStatus, highlightedMessageId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const prevLengthRef = useRef(messages.length)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setNewMessageCount(0)
  }, [])

  // Track scroll position
  function handleScroll() {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50)
  }

  // Auto-scroll on new messages if at bottom
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      if (isAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else {
        setNewMessageCount((c) => c + (messages.length - prevLengthRef.current))
      }
    }
    prevLengthRef.current = messages.length
  }, [messages.length, isAtBottom])

  // Scroll to highlighted message
  useEffect(() => {
    if (highlightedMessageId) {
      document.getElementById(`msg-${highlightedMessageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedMessageId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No messages in this channel
      </div>
    )
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            author={profiles.get(msg.user_id)}
            status={getStatus(msg.user_id)}
            highlighted={msg.id === highlightedMessageId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {newMessageCount > 0 && !isAtBottom && (
        <UnreadBanner count={newMessageCount} onClick={scrollToBottom} />
      )}
    </div>
  )
}
```

- [ ] **Step 7: Implement UnreadBanner**

Create `src/components/messages/UnreadBanner.tsx`:

```tsx
interface UnreadBannerProps {
  count: number
  onClick: () => void
}

export function UnreadBanner({ count, onClick }: UnreadBannerProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-full shadow-lg hover:bg-indigo-500 transition-colors"
    >
      {count} new message{count !== 1 ? 's' : ''} — click to scroll down
    </button>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/messages/ src/tests/components/MessageInput.test.tsx
git commit -m "feat: add message components (list, item, input, unread banner) with tests"
```

---

## Task 13: Presence + Search Components

**Files:**
- Create: `superpowers/src/components/presence/UserAvatar.tsx`, `superpowers/src/components/presence/PresenceIndicator.tsx`, `superpowers/src/components/layout/MemberList.tsx`, `superpowers/src/components/search/SearchInput.tsx`, `superpowers/src/components/search/SearchResults.tsx`

- [ ] **Step 1: Implement PresenceIndicator**

Create `src/components/presence/PresenceIndicator.tsx`:

```tsx
const colors = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-500',
}

interface PresenceIndicatorProps {
  status: 'online' | 'idle' | 'offline'
}

export function PresenceIndicator({ status }: PresenceIndicatorProps) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]} ring-2 ring-gray-800`}
      title={status}
    />
  )
}
```

- [ ] **Step 2: Implement UserAvatar**

Create `src/components/presence/UserAvatar.tsx`:

```tsx
import { PresenceIndicator } from './PresenceIndicator'

interface UserAvatarProps {
  username: string
  status: 'online' | 'idle' | 'offline'
  size?: 'sm' | 'md'
  avatarUrl?: string | null
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
}

export function UserAvatar({ username, status, size = 'md', avatarUrl }: UserAvatarProps) {
  const initial = username.charAt(0).toUpperCase()

  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-indigo-700 flex items-center justify-center font-medium text-white`}>
          {initial}
        </div>
      )}
      <div className="absolute -bottom-0.5 -right-0.5">
        <PresenceIndicator status={status} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement MemberList**

Create `src/components/layout/MemberList.tsx`:

```tsx
import { UserAvatar } from '../presence/UserAvatar'
import type { Profile } from '../../lib/types'

interface MemberListProps {
  members: Profile[]
  getStatus: (userId: string) => 'online' | 'idle' | 'offline'
}

export function MemberList({ members, getStatus }: MemberListProps) {
  const online = members.filter((m) => getStatus(m.id) === 'online')
  const offline = members.filter((m) => getStatus(m.id) !== 'online')

  return (
    <div className="p-3 overflow-y-auto h-full">
      {online.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Online — {online.length}
          </p>
          <div className="space-y-2 mb-4">
            {online.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <UserAvatar username={m.username} status="online" size="sm" avatarUrl={m.avatar_url} />
                <span className="text-sm text-gray-300 truncate">{m.username}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {offline.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Offline — {offline.length}
          </p>
          <div className="space-y-2">
            {offline.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <UserAvatar username={m.username} status={getStatus(m.id)} size="sm" avatarUrl={m.avatar_url} />
                <span className="text-sm text-gray-500 truncate">{m.username}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Implement SearchInput**

Create `src/components/search/SearchInput.tsx`:

```tsx
import { useState, useCallback } from 'react'

interface SearchInputProps {
  onSearch: (query: string) => void
}

export function SearchInput({ onSearch }: SearchInputProps) {
  const [query, setQuery] = useState('')

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch(query.trim())
    }
  }, [query, onSearch])

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Search messages..."
      className="w-full bg-gray-700 text-white text-sm rounded-md px-3 py-1.5 placeholder-gray-500"
    />
  )
}
```

- [ ] **Step 5: Implement SearchResults**

Create `src/components/search/SearchResults.tsx`:

```tsx
import { Spinner } from '../ui/Spinner'
import type { Message } from '../../lib/types'

interface SearchResult extends Message {
  channel_name?: string
}

interface SearchResultsProps {
  results: SearchResult[]
  loading: boolean
  error: string | null
  onResultClick: (channelId: string, messageId: string) => void
  onClose: () => void
}

export function SearchResults({ results, loading, error, onResultClick, onClose }: SearchResultsProps) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-h-64 overflow-y-auto z-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-xs text-gray-400">Search Results</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xs">Close</button>
      </div>

      {loading && (
        <div className="flex justify-center py-4"><Spinner /></div>
      )}

      {error && <p className="text-red-400 text-sm px-3 py-2">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <p className="text-gray-500 text-sm px-3 py-4 text-center">No results found</p>
      )}

      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => onResultClick(result.channel_id, result.id)}
          className="w-full text-left px-3 py-2 hover:bg-gray-700/50 border-b border-gray-700/50 last:border-0"
        >
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span># {result.channel_name ?? 'unknown'}</span>
            <span>{new Date(result.created_at).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-gray-300 truncate">{result.content}</p>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/presence/ src/components/layout/MemberList.tsx src/components/search/
git commit -m "feat: add presence, member list, and search components"
```

---

## Task 14: ChatPage — Wire Everything Together

**Files:**
- Create: `superpowers/src/pages/ChatPage.tsx`
- Modify: `superpowers/src/App.tsx`

- [ ] **Step 1: Implement ChatPage**

Create `src/pages/ChatPage.tsx`:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChannels } from '../hooks/useChannels'
import { useMessages } from '../hooks/useMessages'
import { usePresence } from '../hooks/usePresence'
import { useSearch } from '../hooks/useSearch'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'
import { AppShell } from '../components/layout/AppShell'
import { Sidebar } from '../components/layout/Sidebar'
import { MemberList } from '../components/layout/MemberList'
import { ChannelHeader } from '../components/channels/ChannelHeader'
import { CreateChannelModal } from '../components/channels/CreateChannelModal'
import { BrowseChannelsModal } from '../components/channels/BrowseChannelsModal'
import { MessageList } from '../components/messages/MessageList'
import { MessageInput } from '../components/messages/MessageInput'
import { SearchResults } from '../components/search/SearchResults'

export function ChatPage() {
  const { user, signOut } = useAuth()
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showBrowseChannels, setShowBrowseChannels] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [memberListOpen, setMemberListOpen] = useState(false)

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map())

  // Hooks
  const { channels, createChannel, joinChannel, leaveChannel } = useChannels(user?.id)
  const { messages, loading: messagesLoading, sendMessage } = useMessages(activeChannelId)
  const { getStatus } = usePresence(user?.id, profile?.username)
  const { results: searchResults, loading: searchLoading, error: searchError, search, clearResults } = useSearch()

  // Channel members for the active channel
  const [channelMembers, setChannelMembers] = useState<Profile[]>([])

  // Fetch own profile
  useEffect(() => {
    if (!user?.id) return

    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (data) setProfile(data)
    }

    fetchProfile()
  }, [user?.id])

  // Fetch all profiles (for displaying message authors)
  useEffect(() => {
    async function fetchProfiles() {
      const { data } = await supabase.from('profiles').select('*')
      if (data) {
        setProfiles(new Map(data.map((p) => [p.id, p])))
      }
    }

    fetchProfiles()
  }, [])

  // Fetch channel members when active channel changes
  useEffect(() => {
    if (!activeChannelId) return

    async function fetchMembers() {
      const { data } = await supabase
        .from('channel_members')
        .select('user_id, profiles(*)')
        .eq('channel_id', activeChannelId)

      if (data) {
        setChannelMembers(data.map((row: any) => row.profiles).filter(Boolean))
      }
    }

    fetchMembers()
  }, [activeChannelId, channels]) // Re-fetch when channels change (join/leave)

  // Auto-select first channel
  useEffect(() => {
    if (!activeChannelId && channels.length > 0) {
      setActiveChannelId(channels[0].id)
    }
  }, [channels, activeChannelId])

  const activeChannel = channels.find((ch) => ch.id === activeChannelId)

  const handleLeaveChannel = useCallback(async () => {
    if (!activeChannelId) return
    await leaveChannel(activeChannelId)

    // Navigate to next channel or null
    const remaining = channels.filter((ch) => ch.id !== activeChannelId)
    setActiveChannelId(remaining.length > 0 ? remaining[0].id : null)
  }, [activeChannelId, channels, leaveChannel])

  const handleSendMessage = useCallback(async (content: string) => {
    if (!user?.id) return { error: new Error('Not authenticated') }
    return sendMessage(user.id, content)
  }, [user?.id, sendMessage])

  const handleSearch = useCallback((query: string) => {
    search(query)
    setShowSearchResults(true)
  }, [search])

  const handleSearchResultClick = useCallback((channelId: string, messageId: string) => {
    setActiveChannelId(channelId)
    setHighlightedMessageId(messageId)
    setShowSearchResults(false)
    clearResults()

    // Clear highlight after animation
    setTimeout(() => setHighlightedMessageId(null), 2000)
  }, [clearResults])

  return (
    <>
      <AppShell
        sidebar={
          <div className="relative">
            <Sidebar
              user={profile}
              channels={channels}
              activeChannelId={activeChannelId}
              onSelectChannel={setActiveChannelId}
              onBrowseChannels={() => setShowBrowseChannels(true)}
              onCreateChannel={() => setShowCreateChannel(true)}
              onSearch={handleSearch}
              onSignOut={signOut}
              getStatus={getStatus}
            />
            {showSearchResults && (
              <div className="px-4 relative">
                <SearchResults
                  results={searchResults}
                  loading={searchLoading}
                  error={searchError}
                  onResultClick={handleSearchResultClick}
                  onClose={() => { setShowSearchResults(false); clearResults() }}
                />
              </div>
            )}
          </div>
        }
        main={
          activeChannel ? (
            <div className="flex flex-col h-full">
              <ChannelHeader
                channel={activeChannel}
                memberCount={channelMembers.length}
                onToggleMembers={() => setMemberListOpen((v) => !v)}
                onLeave={handleLeaveChannel}
              />
              <MessageList
                messages={messages}
                profiles={profiles}
                loading={messagesLoading}
                getStatus={getStatus}
                highlightedMessageId={highlightedMessageId}
              />
              <MessageInput onSend={handleSendMessage} disabled={false} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {channels.length === 0
                ? 'No channels yet — create one or browse existing channels!'
                : 'Select a channel to start chatting'}
            </div>
          )
        }
        memberList={
          memberListOpen ? (
            <MemberList members={channelMembers} getStatus={getStatus} />
          ) : undefined
        }
      />

      <CreateChannelModal
        open={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onCreate={createChannel}
      />

      <BrowseChannelsModal
        open={showBrowseChannels}
        onClose={() => setShowBrowseChannels(false)}
        joinedChannelIds={new Set(channels.map((ch) => ch.id))}
        onJoin={joinChannel}
      />
    </>
  )
}
```

- [ ] **Step 2: Update App.tsx to use ChatPage**

Replace the placeholder in `src/App.tsx`:

```tsx
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { ChatPage } from './pages/ChatPage'

function AppContent() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return <ChatPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Verify:
1. Login page renders
2. After sign up/in, chat page loads with sidebar + message area
3. Can create a channel
4. Can send and receive messages (in two browser tabs)
5. Presence indicators update

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: wire up ChatPage with all hooks and components — app is functional"
```

---

## Task 15: Final Polish + Reconnection Banner

**Files:**
- Modify: `superpowers/src/pages/ChatPage.tsx`
- Modify: `superpowers/src/components/layout/AppShell.tsx`

- [ ] **Step 1: Add reconnection banner**

Add a connection status tracker to `ChatPage.tsx`. Add this state and effect inside `ChatPage`:

```tsx
const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting'>('connected')

useEffect(() => {
  // Monitor a heartbeat channel for connection status
  const heartbeat = supabase.channel('heartbeat')
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected')
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnectionStatus('reconnecting')
      }
    })

  return () => { supabase.removeChannel(heartbeat) }
}, [])
```

Add the banner JSX at the top of the message area (inside the `activeChannel` branch, before `<ChannelHeader>`):

```tsx
{connectionStatus === 'reconnecting' && (
  <div className="bg-yellow-600/80 text-white text-sm text-center py-1">
    Reconnecting...
  </div>
)}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 3: Final manual verification**

```bash
npm run dev
```

Walk through the full flow: sign up, create channel, send messages between tabs, search, leave channel, sign out.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: add reconnection banner and final polish"
```

---

## Summary

| Task | What it builds | Tests |
|------|---------------|-------|
| 1 | Project scaffolding (Vite + React + Tailwind + Supabase) | Setup only |
| 2 | Database schema (tables, RLS, indexes, full-text search) | Manual SQL |
| 3 | Supabase client + TypeScript types | — |
| 4 | Auth hook (signIn, signUp, signOut, session) | 3 tests |
| 5 | Auth UI (LoginForm, SignUpForm, AuthGuard, LoginPage) | 3 tests |
| 6 | UI primitives (Button, Spinner, Modal, ErrorMessage, ErrorBoundary) | — |
| 7 | Channels hook (list, create, join, leave, realtime) | 2 tests |
| 8 | Messages hook (fetch, send, realtime, pagination) | 2 tests |
| 9 | Presence + Search hooks | — |
| 10 | Layout (AppShell, Sidebar) | — |
| 11 | Channel components (list, header, create, browse) | 3 tests |
| 12 | Message components (list, item, input, unread banner) | 3 tests |
| 13 | Presence + Search components | — |
| 14 | ChatPage — wire everything together | Smoke test |
| 15 | Reconnection banner + final polish | Smoke test |
