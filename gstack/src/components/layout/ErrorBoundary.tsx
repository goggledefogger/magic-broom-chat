import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--slack-aubergine)] px-4">
          <div className="w-full max-w-md text-center">
            <h1 className="mb-2 text-2xl font-bold text-white">
              Something went wrong
            </h1>
            <p className="mb-6 text-sm text-[var(--slack-text-sidebar)]">
              An unexpected error occurred. Try reloading the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-[var(--slack-aubergine)] transition-colors hover:bg-white/90"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
