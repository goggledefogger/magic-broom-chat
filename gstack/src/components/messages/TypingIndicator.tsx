import { useTyping } from '@/hooks/useTyping'

const dotKeyframes = `
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
`

function BouncingDots() {
  return (
    <>
      <style>{dotKeyframes}</style>
      <span className="inline-flex items-center gap-0.5 ml-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1 w-1 rounded-full bg-muted-foreground"
            style={{
              animation: 'typing-bounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
    </>
  )
}

interface TypingIndicatorProps {
  channelId: string
}

export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const { typingUsers } = useTyping(channelId)

  if (typingUsers.length === 0) {
    return <div className="h-6 shrink-0" />
  }

  let text: string
  if (typingUsers.length === 1) {
    text = `${typingUsers[0].displayName} is typing`
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing`
  } else {
    text = `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing`
  }

  return (
    <div className="flex h-6 shrink-0 items-center px-4">
      <span className="text-xs text-muted-foreground">
        {text}
        <BouncingDots />
      </span>
    </div>
  )
}
