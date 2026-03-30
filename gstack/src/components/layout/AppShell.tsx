import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'
import { Hash, MessageSquare, Search } from 'lucide-react'
import { ChannelSidebar } from '@/components/channels/ChannelSidebar'
import { useChannels } from '@/hooks/useChannels'
import { CommandPaletteContext } from '@/hooks/useCommandPalette'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export function AppShell() {
  const [commandOpen, setCommandOpen] = useState(false)
  const { channelId } = useParams()
  const navigate = useNavigate()
  const { channels, joinedChannels, loading } = useChannels()

  // Cmd+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // If at root with no channelId, redirect to first joined channel
  useEffect(() => {
    if (!loading && !channelId && joinedChannels.length > 0) {
      const firstJoinedId = joinedChannels[0].channel_id
      const channel = channels.find((c) => c.id === firstJoinedId)
      if (channel) {
        navigate(`/channel/${channel.slug}`, { replace: true })
      }
    }
  }, [loading, channelId, joinedChannels, channels, navigate])

  return (
    <CommandPaletteContext.Provider
      value={{ open: commandOpen, setOpen: setCommandOpen }}
    >
      <div className="flex h-svh overflow-hidden">
        {/* Sidebar - fixed 260px */}
        <aside className="w-[260px] shrink-0">
          <ChannelSidebar />
        </aside>

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search channels and messages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Channels">
            {channels.map((channel) => (
              <CommandItem
                key={channel.id}
                value={channel.name}
                onSelect={() => {
                  navigate(`/channel/${channel.slug}`)
                  setCommandOpen(false)
                }}
              >
                <Hash className="size-4" />
                <span>{channel.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem
              value="browse-channels"
              onSelect={() => {
                navigate('/browse')
                setCommandOpen(false)
              }}
            >
              <Search className="size-4" />
              <span>Browse all channels</span>
            </CommandItem>
            <CommandItem
              value="search-messages"
              onSelect={() => {
                navigate('/search')
                setCommandOpen(false)
              }}
            >
              <MessageSquare className="size-4" />
              <span>Search messages</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  )
}
