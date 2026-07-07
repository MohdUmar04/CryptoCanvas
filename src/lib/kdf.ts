import { scryptAsync } from '@noble/hashes/scrypt.js'

const enc = new TextEncoder()

/** PBKDF2-HMAC-SHA-256 via WebCrypto (native speed). */
export async function derivePbkdf2(
  password: string,
  salt: string,
  iterations: number,
  dkLen = 32,
): Promise<Uint8Array> {
  if (iterations < 1) throw new Error('Iterations must be at least 1.')
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt) as BufferSource, iterations },
    keyMaterial,
    dkLen * 8,
  )
  return new Uint8Array(bits)
}

/** scrypt via @noble/hashes. Memory use is 128·N·r bytes — keep N ≤ 2^16 in the UI. */
export async function deriveScrypt(
  password: string,
  salt: string,
  N: number,
  r = 8,
  p = 1,
  dkLen = 32,
): Promise<Uint8Array> {
  if (N < 2 || (N & (N - 1)) !== 0) throw new Error('scrypt N must be a power of 2.')
  return scryptAsync(enc.encode(password), enc.encode(salt), { N, r, p, dkLen })
}

export type TimedResult = { key: Uint8Array; ms: number }

/** Run a derivation and report how long it took — the whole point of a KDF. */
export async function timeDerivation(fn: () => Promise<Uint8Array>): Promise<TimedResult> {
  const start = performance.now()
  const key = await fn()
  return { key, ms: performance.now() - start }
}
