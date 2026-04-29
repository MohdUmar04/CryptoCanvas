import { ed25519 } from '@noble/curves/ed25519.js'
import { randomBytes } from './bytes'

export const LOWER = 'abcdefghijklmnopqrstuvwxyz'
export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const DIGITS = '0123456789'
export const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/'

export type PasswordOpts = {
  length: number
  lower: boolean
  upper: boolean
  digits: boolean
  symbols: boolean
}

export function generatePassword(opts: PasswordOpts): string {
  const chars =
    (opts.lower ? LOWER : '') +
    (opts.upper ? UPPER : '') +
    (opts.digits ? DIGITS : '') +
    (opts.symbols ? SYMBOLS : '')
  if (chars.length === 0) {
    throw new Error('Pick at least one character class.')
  }
  const cutoff = 256 - (256 % chars.length)
  const out: string[] = []
  while (out.length < opts.length) {
    const buf = randomBytes(Math.max(opts.length * 2, 32))
    for (let i = 0; i < buf.length && out.length < opts.length; i++) {
      const b = buf[i]
      if (b < cutoff) out.push(chars[b % chars.length])
    }
  }
  return out.join('')
}

export function generateEd25519Pair(): { publicKey: Uint8Array; privateKey: Uint8Array } {
  const privateKey = ed25519.utils.randomSecretKey()
  const publicKey = ed25519.getPublicKey(privateKey)
  return { publicKey, privateKey }
}
