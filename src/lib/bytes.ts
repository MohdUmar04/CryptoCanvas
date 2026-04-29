const enc = new TextEncoder()
const dec = new TextDecoder()

export function utf8ToBytes(text: string): Uint8Array {
  // Wrap via the current realm's constructor so the result passes
  // `instanceof Uint8Array` checks even across module boundaries (e.g. jose in jsdom).
  return new Uint8Array(enc.encode(text))
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return dec.decode(bytes)
}

export function bytesToHex(bytes: Uint8Array, separator = ''): string {
  const parts: string[] = []
  for (const b of bytes) parts.push(b.toString(16).padStart(2, '0'))
  return parts.join(separator)
}

export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/(0x|:|\s)+/gi, '').toLowerCase()
  if (cleaned === '') return new Uint8Array(0)
  if (cleaned.length % 2 !== 0) throw new Error('Hex must have an even number of digits.')
  if (!/^[0-9a-f]+$/.test(cleaned)) throw new Error('Hex must contain only 0–9 and a–f.')
  const out = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  if (bytes.length === 0) return ''
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  let out = btoa(bin)
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return out
}

export function base64ToBytes(input: string): Uint8Array {
  const trimmed = input.trim().replace(/\s+/g, '')
  if (trimmed === '') return new Uint8Array(0)
  let v = trimmed
  if (/[-_]/.test(v)) v = v.replace(/-/g, '+').replace(/_/g, '/')
  while (v.length % 4) v += '='
  let bin: string
  try {
    bin = atob(v)
  } catch {
    throw new Error('Input is not valid Base64.')
  }
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrs) {
    out.set(a, off)
    off += a.length
  }
  return out
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length)
  crypto.getRandomValues(out)
  return out
}
