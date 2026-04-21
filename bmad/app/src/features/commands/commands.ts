import type { SlashCommand } from './types'

// Add a command by appending to this array. Each entry is self-contained:
// the parser, the composer integration, and the /help dialog all read from
// here, so there's no wiring to update elsewhere.
//
// Return { kind: 'send', content } to send text, or { kind: 'consume' } for
// a UI-only effect (like /help opening a dialog). If args are required but
// missing, return { kind: 'consume' } to silently drop — the command name
// and usage string are shown via /help.
export const COMMANDS: SlashCommand[] = [
  {
    name: 'help',
    description: 'Show all magical commands',
    usage: '/help',
    execute: (ctx) => {
      ctx.openHelp()
      return { kind: 'consume' }
    },
  },
  {
    name: 'shrug',
    description: 'Send the shrug of indifference',
    usage: '/shrug',
    execute: () => ({ kind: 'send', content: '\u00af\\_(\u30c4)_/\u00af' }),
  },
  {
    name: 'me',
    description: 'Narrate your own action',
    usage: '/me <action>',
    execute: (ctx) => {
      const action = ctx.args.trim()
      if (!action) return { kind: 'consume' }
      return { kind: 'send', content: `\u{1F3AD} ${ctx.displayName} ${action}` }
    },
  },
  {
    name: 'spell',
    description: 'Cast a sparkling incantation',
    usage: '/spell <message>',
    execute: (ctx) => {
      const msg = ctx.args.trim()
      if (!msg) return { kind: 'consume' }
      return { kind: 'send', content: `\u2728 ${msg} \u2728` }
    },
  },
  {
    name: 'yensid',
    description: 'Pronounce as the Sorcerer Yen Sid',
    usage: '/yensid <message>',
    execute: (ctx) => {
      const msg = ctx.args.trim()
      if (!msg) return { kind: 'consume' }
      return { kind: 'send', content: `\u{1F4DC} YEN SID DECREES: ${msg.toUpperCase()}` }
    },
  },
  {
    name: 'broom',
    description: 'Multiply your message like enchanted brooms',
    usage: '/broom <message>',
    execute: (ctx) => {
      const msg = ctx.args.trim()
      if (!msg) return { kind: 'consume' }
      const line = `\u{1F9F9} ${msg}`
      return { kind: 'send', content: `${line}\n${line}\n${line}` }
    },
  },
]
