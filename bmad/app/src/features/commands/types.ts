export type CommandContext = {
  args: string
  displayName: string
  openHelp: () => void
}

export type CommandResult =
  | { kind: 'send'; content: string }
  | { kind: 'consume' }

export type SlashCommand = {
  name: string
  description: string
  usage: string
  execute: (ctx: CommandContext) => CommandResult
}
