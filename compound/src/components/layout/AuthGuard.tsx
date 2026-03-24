import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

export function AuthGuard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <p className="text-clay-500">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}
