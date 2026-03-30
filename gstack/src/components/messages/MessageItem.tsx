import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { MessageWithProfile } from '@/hooks/useMessages'

const AVATAR_COLORS = [
  'bg-purple-600',
  'bg-green-600',
  'bg-orange-500',
  'bg-red-600',
  'bg-blue-600',
]

function hashUserId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

interface MessageItemProps {
  message: MessageWithProfile
  grouped: boolean
  isOwn: boolean
  onRetry?: (localId: string) => void
}

export function MessageItem({ message, grouped, isOwn: _isOwn, onRetry }: MessageItemProps) {
  const displayName = message.profiles?.display_name ?? 'Unknown'
  const initial = displayName.charAt(0).toUpperCase()
  const colorClass = AVATAR_COLORS[hashUserId(message.user_id) % AVATAR_COLORS.length]

  if (grouped) {
    return (
      <div
        className={cn(
          'group relative -mx-4 px-4 py-0.5 transition-colors hover:bg-[var(--chat-hover,hsl(var(--accent)))]',
          message.pending && 'opacity-60',
          message.failed && 'border-l-2 border-red-500',
        )}
      >
        <div className="pl-[44px]">
          <p className="text-sm leading-relaxed text-[var(--chat-text,hsl(var(--foreground)))]">
            {message.content}
          </p>
          {message.failed && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-red-500">Failed to send</span>
              {onRetry && message.localId && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-xs text-red-500 hover:text-red-400"
                  onClick={() => onRetry(message.localId!)}
                >
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative -mx-4 px-4 py-1.5 transition-colors hover:bg-[var(--chat-hover,hsl(var(--accent)))]',
        message.pending && 'opacity-60',
        message.failed && 'border-l-2 border-red-500',
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white',
            colorClass,
          )}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[var(--chat-text,hsl(var(--foreground)))]">
              {displayName}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--chat-text,hsl(var(--foreground)))]">
            {message.content}
          </p>
          {message.failed && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-red-500">Failed to send</span>
              {onRetry && message.localId && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-xs text-red-500 hover:text-red-400"
                  onClick={() => onRetry(message.localId!)}
                >
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
