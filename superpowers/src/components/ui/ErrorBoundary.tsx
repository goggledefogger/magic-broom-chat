import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <button
            onClick={() => window.location.reload()}
            className="text-indigo-400 hover:underline"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
