import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { AuthPage } from '@/components/auth/AuthPage'
import { AuthCallback } from '@/components/auth/AuthCallback'

function AppShellPlaceholder() {
  return (
    <div className="flex items-center justify-center min-h-svh">
      <h1 className="text-2xl font-semibold text-sand-800">Magic Broom Chat</h1>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<AuthGuard />}>
            <Route path="/" element={<Navigate to="/channels/general" replace />} />
            <Route path="/channels/:channelSlug" element={<AppShellPlaceholder />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
