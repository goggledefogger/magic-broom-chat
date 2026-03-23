const colors = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-500',
}

interface PresenceIndicatorProps {
  status: 'online' | 'idle' | 'offline'
}

export function PresenceIndicator({ status }: PresenceIndicatorProps) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]} ring-2 ring-gray-800`}
      title={status}
    />
  )
}
