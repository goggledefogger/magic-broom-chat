import { Routes, Route, Navigate } from 'react-router'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { AuthPage } from '@/components/auth/AuthPage'
import { AuthCallback } from '@/components/auth/AuthCallback'
import { AppShell } from '@/components/layout/AppShell'
import { ChannelView } from '@/components/channels/ChannelView'
import { ChannelBrowser } from '@/components/channels/ChannelBrowser'
import { SearchPage } from '@/components/search/SearchPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/browse" replace />} />
        <Route path="channel/:channelId" element={<ChannelView />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="browse" element={<ChannelBrowser />} />
      </Route>
    </Routes>
  )
}
