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
