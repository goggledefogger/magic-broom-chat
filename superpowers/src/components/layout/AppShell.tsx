import { useState, type ReactNode } from 'react'
import { ErrorBoundary } from '../ui/ErrorBoundary'

interface AppShellProps {
  sidebar: ReactNode
  main: ReactNode
  memberList?: ReactNode
}

export function AppShell({ sidebar, main, memberList }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ErrorBoundary>
      <div className="h-screen flex bg-gray-900 text-white overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 flex-shrink-0
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {sidebar}
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden flex items-center p-2 bg-gray-800 border-b border-gray-700">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
              {main}
            </div>

            {memberList && (
              <aside className="w-52 bg-gray-800 border-l border-gray-700 flex-shrink-0 hidden md:block">
                {memberList}
              </aside>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
