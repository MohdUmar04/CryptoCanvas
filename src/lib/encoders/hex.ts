const enc = new TextEncoder()
const dec = new TextDecoder()

export function textToHex(text: string): string {
  if (text === '') return ''
  const bytes = enc.encode(text)
  const out: string[] = []
  for (const b of bytes) out.push(b.toString(16).padStart(2, '0'))
  return out.join(' ')
}

export function hexToText(input: string): string {
  const cleaned = input.replace(/(0x|:|\s)+/gi, '').toLowerCase()
  if (cleaned === '') return ''
  if (cleaned.length % 2 !== 0) throw new Error('Hex must have an even number of digits.')
  if (!/^[0-9a-f]+$/.test(cleaned)) throw new Error('Hex must contain only 0–9 and a–f.')
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16)
  }
  return dec.decode(bytes)
}
