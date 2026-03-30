import { cn } from '@/lib/utils'

interface OnlineStatusDotProps {
  isOnline: boolean
  isIdle?: boolean
  size?: 'sm' | 'md'
}

export function OnlineStatusDot({ isOnline, isIdle, size = 'sm' }: OnlineStatusDotProps) {
  const sizeClass = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'

  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full',
        sizeClass,
        isOnline && !isIdle && 'bg-[#2BAC76]',
        isOnline && isIdle && 'bg-[#E8A14B]',
        !isOnline && 'border border-muted-foreground/50 bg-transparent',
      )}
      aria-label={isOnline ? (isIdle ? 'Idle' : 'Online') : 'Offline'}
    />
  )
}
