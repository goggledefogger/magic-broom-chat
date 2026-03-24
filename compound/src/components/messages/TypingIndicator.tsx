interface TypingUser {
  userId: string
  displayName: string
}

export function TypingIndicator({ typingUsers }: { typingUsers: TypingUser[] }) {
  if (typingUsers.length === 0) return null

  const names = typingUsers.map(u => u.displayName)
  let text: string

  if (names.length === 1) {
    text = `${names[0]} is typing...`
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing...`
  }

  return (
    <div className="px-4 py-1 text-xs text-clay-400 h-5">
      {text}
    </div>
  )
}
