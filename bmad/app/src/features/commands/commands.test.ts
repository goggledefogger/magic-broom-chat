import { describe, it, expect, vi } from 'vitest'
import { parseCommand } from './parseCommand'
import { COMMANDS } from './commands'
import type { CommandContext } from './types'

function ctx(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    args: '',
    displayName: 'Apprentice',
    openHelp: vi.fn(),
    ...overrides,
  }
}

function run(name: string, args: string, c: CommandContext = ctx()) {
  const cmd = COMMANDS.find((x) => x.name === name)
  if (!cmd) throw new Error(`no command named ${name}`)
  return cmd.execute({ ...c, args })
}

describe('parseCommand', () => {
  it('returns null for non-slash input', () => {
    expect(parseCommand('hello world')).toBeNull()
    expect(parseCommand('')).toBeNull()
  })

  it('returns null for unknown commands', () => {
    expect(parseCommand('/nope')).toBeNull()
    expect(parseCommand('/shruggles')).toBeNull()
  })

  it('parses a command with no args', () => {
    const p = parseCommand('/shrug')
    expect(p?.command.name).toBe('shrug')
    expect(p?.args).toBe('')
  })

  it('parses a command with args', () => {
    const p = parseCommand('/spell hello there')
    expect(p?.command.name).toBe('spell')
    expect(p?.args).toBe('hello there')
  })

  it('preserves multi-line args', () => {
    const p = parseCommand('/broom line one\nline two')
    expect(p?.args).toBe('line one\nline two')
  })

  it('is case-insensitive on the command name', () => {
    expect(parseCommand('/SHRUG')?.command.name).toBe('shrug')
  })

  it('tolerates leading whitespace', () => {
    expect(parseCommand('  /shrug')?.command.name).toBe('shrug')
  })
})

describe('command executors', () => {
  it('/shrug sends the shrug', () => {
    const r = run('shrug', '')
    expect(r).toEqual({ kind: 'send', content: '¯\\_(ツ)_/¯' })
  })

  it('/me prefixes the speaker name', () => {
    const r = run('me', 'dances', ctx({ displayName: 'Will' }))
    expect(r).toEqual({ kind: 'send', content: '🎭 Will dances' })
  })

  it('/me with no args is consumed silently', () => {
    expect(run('me', '   ')).toEqual({ kind: 'consume' })
  })

  it('/spell wraps in sparkles', () => {
    const r = run('spell', 'abracadabra')
    expect(r).toEqual({ kind: 'send', content: '✨ abracadabra ✨' })
  })

  it('/yensid shouts in all caps with a scroll', () => {
    const r = run('yensid', 'to bed, apprentice')
    expect(r).toEqual({
      kind: 'send',
      content: '📜 YEN SID DECREES: TO BED, APPRENTICE',
    })
  })

  it('/broom triples the message', () => {
    const r = run('broom', 'fetch water')
    expect(r).toEqual({
      kind: 'send',
      content: '🧹 fetch water\n🧹 fetch water\n🧹 fetch water',
    })
  })

  it('/help calls openHelp and consumes', () => {
    const openHelp = vi.fn()
    const r = run('help', '', ctx({ openHelp }))
    expect(openHelp).toHaveBeenCalledOnce()
    expect(r).toEqual({ kind: 'consume' })
  })
})
