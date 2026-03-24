import { useState } from 'react'
import { Pencil, Trash2, RotateCcw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MessageWithProfile } from '@/hooks/useMessages'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-ember-200 text-ember-700 text-xs font-medium shrink-0">
      {initials}
    </div>
  )
}

export function MessageItem({
  message,
  onEdit,
  onDelete,
  onRetry,
}: {
  message: MessageWithProfile
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onRetry: (localId: string) => void
}) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const isOwn = user?.id === message.user_id
  const displayName = message.profiles?.display_name ?? 'Unknown'
  const avatarUrl = message.profiles?.avatar_url
  const isEdited = message.updated_at !== message.created_at

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim())
    }
    setEditing(false)
  }

  return (
    <div
      className={`group flex gap-3 px-4 py-1.5 hover:bg-sand-100/50 ${
        message.pending ? 'opacity-60' : ''
      } ${message.failed ? 'opacity-80' : ''}`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full shrink-0 mt-0.5" />
      ) : (
        <div className="mt-0.5">
          <InitialsAvatar name={displayName} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-sand-800">{displayName}</span>
          <span className="text-xs text-clay-400">{formatTime(message.created_at)}</span>
          {isEdited && <span className="text-xs text-clay-300">(edited)</span>}
        </div>

        {editing ? (
          <form onSubmit={handleEditSubmit} className="flex gap-2 mt-1">
            <Input
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="text-sm"
              autoFocus
            />
            <Button type="submit" size="sm" className="bg-ember-500 hover:bg-ember-600">
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <p className="text-sm text-sand-700 whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {message.failed && (
          <button
            onClick={() => message.localId && onRetry(message.localId)}
            className="flex items-center gap-1 mt-1 text-xs text-ember-600 hover:underline"
          >
            <RotateCcw className="h-3 w-3" />
            Failed to send. Click to retry.
          </button>
        )}
      </div>

      {isOwn && !message.pending && !message.failed && !editing && (
        <div className="opacity-0 group-hover:opacity-100 flex items-start gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => { setEditContent(message.content); setEditing(true) }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-ember-500"
            onClick={() => onDelete(message.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
