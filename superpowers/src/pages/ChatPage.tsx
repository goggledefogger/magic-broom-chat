import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChannels } from '../hooks/useChannels'
import { useMessages } from '../hooks/useMessages'
import { usePresence } from '../hooks/usePresence'
import { useSearch } from '../hooks/useSearch'
import { useProfiles } from '../hooks/useProfiles'
import { useChannelMembers } from '../hooks/useChannelMembers'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
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

  // Hooks
  const { channels, createChannel, joinChannel, leaveChannel, fetchAllChannels } = useChannels(user?.id)
  const { messages, loading: messagesLoading, sendMessage, loadMore } = useMessages(activeChannelId)
  const { profile, profiles } = useProfiles(user?.id)
  const { getStatus } = usePresence(user?.id, profile?.username)
  const { results: searchResults, loading: searchLoading, error: searchError, search, clearResults } = useSearch()
  const connectionStatus = useConnectionStatus()
  const channelMembers = useChannelMembers(activeChannelId, channels)

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
                onLoadMore={loadMore}
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
        fetchAllChannels={fetchAllChannels}
      />
    </>
  )
}
