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

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting'>('connected')

  useEffect(() => {
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
  }, [activeChannelId, channels])

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
              {connectionStatus === 'reconnecting' && (
                <div className="bg-yellow-600/80 text-white text-sm text-center py-1">
                  Reconnecting...
                </div>
              )}
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
