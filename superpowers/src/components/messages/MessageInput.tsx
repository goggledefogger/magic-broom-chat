import { useState, type FormEvent } from 'react'

interface MessageInputProps {
  onSend: (content: string) => Promise<{ error: any }>
  disabled: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim() || sending) return

    setError(null)
    setSending(true)

    const result = await onSend(content.trim())
    if (result.error) {
      setError(result.error.message)
    } else {
      setContent('')
    }
    setSending(false)
  }

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4">
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-gray-700 text-white rounded-md px-3 py-2 text-sm placeholder-gray-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || sending || !content.trim()}
          aria-label="Send"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
