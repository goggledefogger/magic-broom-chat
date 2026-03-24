import { useNavigate, useParams } from 'react-router'
import { Hash, Lock, Plus, Search, LogOut, Compass } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useChannels } from '@/hooks/useChannels'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { CreateChannelDialog } from './CreateChannelDialog'
import { ChannelBrowser } from './ChannelBrowser'

export function ChannelSidebar() {
  const { channelSlug } = useParams()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { joinedChannels } = useChannels()
  const [showCreate, setShowCreate] = useState(false)
  const [showBrowser, setShowBrowser] = useState(false)

  return (
    <aside className="flex flex-col w-64 bg-sand-100 border-r border-clay-200 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-clay-200">
        <h2 className="text-sm font-semibold text-sand-800">Magic Broom</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="px-2 pt-2 space-y-0.5">
        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-clay-600 hover:bg-sand-200 rounded-md"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
        <button
          onClick={() => setShowBrowser(true)}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-clay-600 hover:bg-sand-200 rounded-md"
        >
          <Compass className="h-4 w-4" />
          Browse channels
        </button>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 pt-3">
        <p className="px-2 mb-1 text-xs font-medium text-clay-400 uppercase tracking-wider">Channels</p>
        <nav className="space-y-0.5">
          {joinedChannels.map(channel => (
            <button
              key={channel.id}
              onClick={() => navigate(`/channels/${channel.slug}`)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors ${
                channelSlug === channel.slug
                  ? 'bg-ember-100 text-ember-700 font-medium'
                  : 'text-sand-700 hover:bg-sand-200'
              }`}
            >
              {channel.is_private ? (
                <Lock className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Hash className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* User footer */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-clay-200">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-ember-200 text-ember-700 text-xs font-medium shrink-0">
          {profile?.display_name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <span className="text-sm text-sand-700 truncate flex-1">{profile?.display_name}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={signOut}>
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Dialogs */}
      <CreateChannelDialog open={showCreate} onOpenChange={setShowCreate} />
      <ChannelBrowser open={showBrowser} onOpenChange={setShowBrowser} />
    </aside>
  )
}
