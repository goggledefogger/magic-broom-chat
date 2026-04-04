import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { AppLayout } from '@/components/shared/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ChannelPage } from '@/features/channels/ChannelPage'
import { GalleryCardDetail } from '@/features/gallery/GalleryCardDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected routes */}
            <Route
              path="/channels/:channelId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ChannelPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/channels/:channelId/card/:cardId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GalleryCardDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-3">
                        <p className="font-heading text-3xl text-foreground">Welcome to the Workshop</p>
                        <p className="text-sm">Select a channel to begin your apprenticeship</p>
                        <div className="mx-auto mt-2 w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                      </div>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
