import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { useChannels, useMyMemberships, useCreateChannel, useJoinChannel, type Channel } from '@/hooks/useChannels'
import { useProfile } from '@/hooks/useProfile'
import { useUnreadCounts, useGalleryCardCounts } from '@/hooks/useUnreadCounts'
import { useSearch, type SearchResult } from '@/hooks/useSearch'
import { MenuIcon } from 'lucide-react'

// Channels new users auto-join on first login (by name).
const AUTO_JOIN_CHANNELS = [
  'general',
  'welcome',
  'announcements',
  'cohort-2',
  'pilot-cohort',
  'project-showcase',
  'resources',
]

function SidebarContent({
  channels,
  memberChannelIds,
  unreadCounts,
  galleryCardCounts,
  recentlyJoined,
  channelId,
  profile,
  user,
  searchQuery,
  setSearchQuery,
  showSearch,
  setShowSearch,
  searchResults,
  onSearchResultClick,
  onJoinChannel,
  onCreateChannel,
  onSignOut,
}: {
  channels: Channel[] | undefined
  memberChannelIds: Set<string>
  unreadCounts: Map<string, number> | undefined
  galleryCardCounts: Map<string, number> | undefined
  recentlyJoined: Set<string>
  channelId: string | undefined
  profile: { displayName: string | null; role: string } | undefined
  user: { id: string; email?: string } | null
  searchQuery: string
  setSearchQuery: (q: string) => void
  showSearch: boolean
  setShowSearch: (s: boolean) => void
  searchResults: SearchResult[] | undefined
  onSearchResultClick: (r: SearchResult) => void
  onJoinChannel: (chId: string) => void
  onCreateChannel: () => void
  onSignOut: () => void
}) {
  return (
    <>
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <span className="text-lg text-sidebar-primary" aria-hidden="true">&#10022;</span>
        <h1 className="font-heading text-xl tracking-wide text-sidebar-primary">
          Magic Brooms
        </h1>
      </div>
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/30 to-transparent" />

      {/* Search */}
      <div className="p-3">
        <Input
          placeholder="Search the workshop..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowSearch(e.target.value.length > 0)
          }}
          className="bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 h-8 text-sm"
        />
      </div>

      {/* Search results overlay */}
      {showSearch && searchResults && searchResults.length > 0 && (
        <div className="relative z-50 border-b border-sidebar-border bg-sidebar p-2">
          <ScrollArea className="max-h-60">
            {searchResults.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => onSearchResultClick(r)}
                className="w-full rounded px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent"
              >
                <span className="text-[10px] uppercase tracking-wider text-sidebar-primary/60">
                  {r.type === 'card' ? 'Card' : 'Message'} in #{r.channelName}
                </span>
                <p className="truncate text-sidebar-foreground">
                  {r.title ?? r.content.slice(0, 80)}
                </p>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Channels */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-primary/50">
              Channels
            </span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-sidebar-primary/40 hover:text-sidebar-primary" onClick={onCreateChannel}>
              +
            </Button>
          </div>

          {channels
            ?.filter((c) => !c.isArchived)
            .map((ch) => {
              const isMember = memberChannelIds.has(ch.id)
              const badgeCount = ch.type === 'gallery'
                ? (galleryCardCounts?.get(ch.id) ?? 0)
                : (unreadCounts?.get(ch.id) ?? 0)
              const isActive = channelId === ch.id
              const justJoined = recentlyJoined.has(ch.id)

              return (
                <div key={ch.id} className={`flex items-center gap-1 ${justJoined ? 'animate-channel-join' : ''}`}>
                  {isMember ? (
                    <Link
                      to={`/channels/${ch.id}`}
                      className={`flex-1 rounded px-2.5 py-1.5 text-sm transition-all ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary font-medium glow-gold-sm'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      } ${badgeCount > 0 ? 'font-semibold' : ''}`}
                    >
                      <span className="mr-1.5 text-sidebar-primary/40">
                        {ch.type === 'gallery' ? '\u25C6' : '#'}
                      </span>
                      {ch.name}
                      {badgeCount > 0 && (
                        <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 justify-center bg-sidebar-primary/20 px-1 text-[10px] text-sidebar-primary">
                          {badgeCount}
                        </Badge>
                      )}
                    </Link>
                  ) : (
                    <button
                      onClick={() => onJoinChannel(ch.id)}
                      className="flex-1 rounded px-2.5 py-1.5 text-left text-sm text-sidebar-foreground/30 italic transition-colors hover:text-sidebar-foreground/50"
                    >
                      <span className="mr-1.5">{ch.type === 'gallery' ? '\u25C6' : '#'}</span>
                      {ch.name}
                      <span className="ml-1 text-[10px] not-italic">(join)</span>
                    </button>
                  )}
                </div>
              )
            })}
        </div>
      </ScrollArea>

      {/* User section */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
      <div className="flex items-center justify-between p-3">
        <Link to="/profile" className="text-sm text-sidebar-foreground/70 transition-colors hover:text-sidebar-primary">
          {profile?.displayName ?? user?.email ?? 'Apprentice'}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="h-6 text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground"
        >
          Logout
        </Button>
      </div>
    </>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { signOut } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: channels } = useChannels()
  const { data: memberships } = useMyMemberships(user?.id)
  const { data: unreadCounts } = useUnreadCounts(user?.id)
  const createChannel = useCreateChannel()
  const joinChannel = useJoinChannel()
  const navigate = useNavigate()
  const { channelId } = useParams()

  const galleryChannelIds = useMemo(
    () => (channels ?? []).filter((c) => c.type === 'gallery').map((c) => c.id),
    [channels]
  )
  const { data: galleryCardCounts } = useGalleryCardCounts(galleryChannelIds)

  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [newChannelType, setNewChannelType] = useState<'standard' | 'gallery'>('standard')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: searchResults } = useSearch(searchQuery)

  const memberChannelIds = useMemo(
    () => new Set(memberships?.map((m) => m.channelId) ?? []),
    [memberships]
  )
  const [recentlyJoined, setRecentlyJoined] = useState<Set<string>>(new Set())
  const autoJoinedRef = useRef(false)
  const [autoJoinTarget, setAutoJoinTarget] = useState<string | null>(null)

  // Auto-join default channels on first login
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (autoJoinedRef.current || !user || !channels || !memberships) return
    if (memberships.length > 0) {
      autoJoinedRef.current = true
      return
    }
    autoJoinedRef.current = true
    const toJoin = channels.filter((c) => AUTO_JOIN_CHANNELS.includes(c.name))
    if (!toJoin.length) return
    const general = toJoin.find((c) => c.name === 'general')
    setAutoJoinTarget(general?.id ?? toJoin[0].id)
    toJoin.forEach((c) => {
      joinChannel.mutate({ channelId: c.id, userId: user.id })
    })
  }, [user, channels, memberships])

  // Navigate to general after auto-join completes
  useEffect(() => {
    if (!autoJoinTarget || !memberships || memberships.length === 0) return
    navigate(`/channels/${autoJoinTarget}`, { replace: true })
    setAutoJoinTarget(null)
  }, [autoJoinTarget, memberships, navigate])

  // Close drawer on channel navigation
  useEffect(() => {
    setDrawerOpen(false)
  }, [channelId])

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !user) return
    await createChannel.mutateAsync({
      name: newChannelName.trim(),
      description: newChannelDesc.trim() || undefined,
      type: newChannelType,
      userId: user.id,
    })
    setNewChannelName('')
    setNewChannelDesc('')
    setNewChannelType('standard')
    setShowCreateChannel(false)
  }

  const handleJoinChannel = async (chId: string) => {
    if (!user) return
    await joinChannel.mutateAsync({ channelId: chId, userId: user.id })
    setRecentlyJoined((prev) => new Set(prev).add(chId))
    setTimeout(() => {
      setRecentlyJoined((prev) => {
        const next = new Set(prev)
        next.delete(chId)
        return next
      })
    }, 1200)
    navigate(`/channels/${chId}`)
  }

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === 'card') {
      navigate(`/channels/${result.channelId}/card/${result.id}`)
    } else {
      navigate(`/channels/${result.channelId}`)
    }
    setShowSearch(false)
    setSearchQuery('')
  }

  const currentChannel = channels?.find((c) => c.id === channelId)

  const sidebarProps = {
    channels,
    memberChannelIds,
    unreadCounts,
    galleryCardCounts,
    recentlyJoined,
    channelId,
    profile: profile ? { displayName: profile.displayName, role: profile.role } : undefined,
    user,
    searchQuery,
    setSearchQuery,
    showSearch,
    setShowSearch,
    searchResults,
    onSearchResultClick: handleSearchResultClick,
    onJoinChannel: handleJoinChannel,
    onCreateChannel: () => setShowCreateChannel(true),
    onSignOut: () => signOut(),
  }

  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent>
          <SidebarContent {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* Create channel dialog */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Create a new channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={newChannelDesc}
              onChange={(e) => setNewChannelDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant={newChannelType === 'standard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewChannelType('standard')}
              >
                Chat
              </Button>
              <Button
                variant={newChannelType === 'gallery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewChannelType('gallery')}
              >
                Gallery
              </Button>
            </div>
            <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
              Create Channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex md:hidden items-center gap-3 border-b border-border/50 px-3 py-2 bg-background">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <span className="flex-1 font-heading text-sm font-semibold truncate">
            {currentChannel ? `#${currentChannel.name}` : 'Magic Brooms'}
          </span>
          <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary">
            {profile?.displayName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
          </Link>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
