import { COMMANDS } from './commands'
import type { SlashCommand } from './types'

export type ParsedCommand = { command: SlashCommand; args: string }

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trimStart()
  if (!trimmed.startsWith('/')) return null
  const match = trimmed.match(/^\/(\w+)(?:\s+([\s\S]*))?$/)
  if (!match) return null
  const [, name, rawArgs] = match
  const command = COMMANDS.find((c) => c.name === name.toLowerCase())
  if (!command) return null
  return { command, args: rawArgs ?? '' }
}
