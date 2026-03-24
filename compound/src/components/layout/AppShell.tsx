import { Outlet } from 'react-router'
import { ChannelSidebar } from '@/components/channels/ChannelSidebar'

export function AppShell() {
  return (
    <div className="flex h-svh bg-sand-50">
      <ChannelSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
