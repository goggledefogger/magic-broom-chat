interface UnreadBannerProps {
  count: number
  onClick: () => void
}

export function UnreadBanner({ count, onClick }: UnreadBannerProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-full shadow-lg hover:bg-indigo-500 transition-colors"
    >
      {count} new message{count !== 1 ? 's' : ''} — click to scroll down
    </button>
  )
}
