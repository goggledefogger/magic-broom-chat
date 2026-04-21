import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { COMMANDS } from './commands'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandHelpDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🎩 Magical Slash Commands</DialogTitle>
          <DialogDescription>
            Type any of these at the start of a message:
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {COMMANDS.map((c) => (
            <li key={c.name} className="flex items-start gap-3">
              <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs shrink-0">
                {c.usage}
              </code>
              <span className="text-muted-foreground">{c.description}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
