import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { useChannels, useMyMemberships, useCreateChannel, useJoinChannel } from '@/hooks/useChannels'
import { useProfile } from '@/hooks/useProfile'
import { useUnreadCounts, useGalleryCardCounts } from '@/hooks/useUnreadCounts'
import { useSearch, type SearchResult } from '@/hooks/useSearch'

// Channels new users auto-join on first login (by name).
// Add/remove names here to change the first-time experience.
const AUTO_JOIN_CHANNELS = [
  'general',
  'welcome',
  'announcements',
  'cohort-2',
  'pilot-cohort',
  'project-showcase',
  'resources',
]

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

  const galleryChannelIds = (channels ?? []).filter((c) => c.type === 'gallery').map((c) => c.id)
  const { data: galleryCardCounts } = useGalleryCardCounts(galleryChannelIds)

  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [newChannelType, setNewChannelType] = useState<'standard' | 'gallery'>('standard')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const { data: searchResults } = useSearch(searchQuery)

  const memberChannelIds = new Set(memberships?.map((m) => m.channelId) ?? [])
  const [recentlyJoined, setRecentlyJoined] = useState<Set<string>>(new Set())
  const autoJoinedRef = useRef(false)
  const [autoJoinTarget, setAutoJoinTarget] = useState<string | null>(null)

  // Auto-join default channels on first login (no memberships yet)
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
  }, [user, channels, memberships, joinChannel])

  // Navigate to general after auto-join completes
  useEffect(() => {
    if (!autoJoinTarget || !memberships || memberships.length === 0) return
    navigate(`/channels/${autoJoinTarget}`, { replace: true })
    setAutoJoinTarget(null)
  }, [autoJoinTarget, memberships, navigate])

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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 p-4">
          <h1 className="text-lg font-bold text-sidebar-primary">Magic Broom</h1>
        </div>
        <Separator className="bg-sidebar-border" />

        {/* Search */}
        <div className="p-3">
          <Input
            placeholder="Search the workshop..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSearch(e.target.value.length > 0)
            }}
            className="bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 h-8 text-sm"
          />
        </div>

        {/* Search results overlay */}
        {showSearch && searchResults && searchResults.length > 0 && (
          <div className="absolute left-0 top-24 z-50 w-64 border-r border-sidebar-border bg-sidebar p-2">
            <ScrollArea className="max-h-60">
              {searchResults.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleSearchResultClick(r)}
                  className="w-full rounded p-2 text-left text-sm hover:bg-sidebar-accent"
                >
                  <span className="text-xs text-sidebar-foreground/60">
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
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                Channels
              </span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={() => setShowCreateChannel(true)}>
                +
              </Button>
              <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a new channel</DialogTitle>
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
                        className={`flex-1 rounded px-2 py-1 text-sm transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
                        } ${badgeCount > 0 ? 'font-bold' : ''}`}
                      >
                        <span className="text-sidebar-foreground/40 mr-1">
                          {ch.type === 'gallery' ? '🖼' : '#'}
                        </span>
                        {ch.name}
                        {badgeCount > 0 && (
                          <Badge variant="secondary" className="ml-1 h-4 min-w-4 justify-center px-1 text-[10px]">
                            {badgeCount}
                          </Badge>
                        )}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleJoinChannel(ch.id)}
                        className="flex-1 rounded px-2 py-1 text-left text-sm text-sidebar-foreground/40 hover:text-sidebar-foreground/60 italic"
                      >
                        <span className="mr-1">{ch.type === 'gallery' ? '🖼' : '#'}</span>
                        {ch.name}
                        <span className="ml-1 text-[10px]">(join)</span>
                      </button>
                    )}
                  </div>
                )
              })}
          </div>
        </ScrollArea>

        {/* User section */}
        <Separator className="bg-sidebar-border" />
        <div className="flex items-center justify-between p-3">
          <Link to="/profile" className="text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground">
            {profile?.displayName ?? user?.email ?? 'Apprentice'}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="h-6 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
