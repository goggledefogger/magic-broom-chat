import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useTyping } from '@/hooks/useTyping'
import { cn } from '@/lib/utils'
import { Paperclip, Smile, AtSign, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageInputProps {
  channelId: string
  channelName: string
}

export function MessageInput({ channelId, channelName }: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage } = useMessages(channelId)
  const { sendTyping } = useTyping(channelId)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed) return

    sendMessage(trimmed)
    setContent('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [content, sendMessage])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value)
      sendTyping()
      adjustHeight()
    },
    [sendTyping, adjustHeight],
  )

  const hasContent = content.trim().length > 0

  return (
    <div className="shrink-0 px-4 pb-4">
      <div
        className={cn(
          'rounded-lg border border-border bg-background transition-shadow',
          'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        )}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}`}
          rows={1}
          className="block w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Attach file"
            >
              <Paperclip className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Add emoji"
            >
              <Smile className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Mention someone"
            >
              <AtSign className="size-4" />
            </Button>
          </div>
          <Button
            size="icon-sm"
            onClick={handleSend}
            disabled={!hasContent}
            className={cn(
              'rounded-md transition-colors',
              hasContent
                ? 'bg-green-700 text-white hover:bg-green-600'
                : 'bg-muted text-muted-foreground',
            )}
            aria-label="Send message"
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
