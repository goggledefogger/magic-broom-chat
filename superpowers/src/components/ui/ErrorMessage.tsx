interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="text-center py-8">
      <p className="text-red-400 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-indigo-400 hover:underline text-sm"
        >
          Try again
        </button>
      )}
    </div>
  )
}
