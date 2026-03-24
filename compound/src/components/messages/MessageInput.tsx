import { useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MessageInput({ onSend }: { onSend: (content: string) => void }) {
  const [content, setContent] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    onSend(trimmed)
    setContent('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 px-4 py-3 border-t border-clay-200">
      <textarea
        ref={inputRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="flex-1 resize-none rounded-lg border border-clay-200 bg-white px-3 py-2 text-sm text-sand-800 placeholder:text-clay-400 focus:outline-none focus:ring-2 focus:ring-ember-300 focus:border-transparent"
      />
      <Button
        type="submit"
        size="icon"
        className="bg-ember-500 hover:bg-ember-600 h-9 w-9 shrink-0"
        disabled={!content.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
