import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useChannels } from '@/hooks/useChannels'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Hash } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { channels } = useChannels()
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelect = useCallback(
    (channelId: string) => {
      navigate(`/channel/${channelId}`)
      setOpen(false)
    },
    [navigate],
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Go to channel"
      description="Search for a channel to navigate to"
    >
      <CommandInput placeholder="Search channels..." />
      <CommandList>
        <CommandEmpty>No channels found.</CommandEmpty>
        <CommandGroup heading="Channels">
          {channels.map((channel) => (
            <CommandItem
              key={channel.id}
              value={channel.name}
              onSelect={() => handleSelect(channel.id)}
            >
              <Hash className="size-4 text-muted-foreground" />
              <span>{channel.name}</span>
              {channel.description && (
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {channel.description}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
