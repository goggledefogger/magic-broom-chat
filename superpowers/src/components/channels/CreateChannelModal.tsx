import { useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface CreateChannelModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description: string) => Promise<{ error: any }>
}

export function CreateChannelModal({ open, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await onCreate(name.trim().toLowerCase().replace(/\s+/g, '-'), description.trim())
    if (result.error) {
      setError(result.error.message)
      setSubmitting(false)
    } else {
      setName('')
      setDescription('')
      setSubmitting(false)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Channel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="channel-name" className="block text-sm font-medium text-gray-300">
            Name
          </label>
          <input
            id="channel-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. general"
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="channel-desc" className="block text-sm font-medium text-gray-300">
            Description (optional)
          </label>
          <input
            id="channel-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
