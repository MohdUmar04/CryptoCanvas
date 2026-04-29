const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const enc = new TextEncoder()
const dec = new TextDecoder()

export function textToBase32(text: string): string {
  if (text === '') return ''
  const bytes = enc.encode(text)
  let bits = 0
  let value = 0
  let out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }
  if (bits > 0) {
    out += ALPHABET[(value << (5 - bits)) & 0x1f]
  }
  while (out.length % 8) out += '='
  return out
}

export function base32ToText(input: string): string {
  const s = input.trim().toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '')
  if (s === '') return ''
  if (!/^[A-Z2-7]+$/.test(s)) throw new Error('Input contains characters outside the Base32 alphabet (A–Z, 2–7).')
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const c of s) {
    const idx = ALPHABET.indexOf(c)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return dec.decode(new Uint8Array(out))
}
