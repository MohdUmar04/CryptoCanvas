const enc = new TextEncoder()
const dec = new TextDecoder()

export function textToBinary(text: string): string {
  if (text === '') return ''
  const bytes = enc.encode(text)
  const parts: string[] = []
  for (const b of bytes) parts.push(b.toString(2).padStart(8, '0'))
  return parts.join(' ')
}

export function binaryToText(binary: string): string {
  const cleaned = binary.replace(/\s+/g, '')
  if (cleaned === '') return ''
  if (!/^[01]+$/.test(cleaned)) throw new Error('Binary must contain only 0 and 1.')
  if (cleaned.length % 8 !== 0) throw new Error('Binary length must be a multiple of 8 bits.')
  const bytes = new Uint8Array(cleaned.length / 8)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 8, i * 8 + 8), 2)
  }
  return dec.decode(bytes)
}
