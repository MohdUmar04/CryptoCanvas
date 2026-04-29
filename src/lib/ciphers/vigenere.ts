export type Mode = 'encrypt' | 'decrypt'

export type VigenereStep = {
  index: number
  plain: string
  cipher: string
  keyLetter: string | null
  shift: number | null
}

function cleanKey(key: string): string {
  return key.replace(/[^a-zA-Z]/g, '').toUpperCase()
}

export function vigenere(text: string, key: string, mode: Mode = 'encrypt'): string {
  const k = cleanKey(key)
  if (k === '') throw new Error('Key must contain at least one letter.')
  let out = ''
  let keyIdx = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    const isUpper = code >= 65 && code <= 90
    const isLower = code >= 97 && code <= 122
    if (!isUpper && !isLower) {
      out += ch
      continue
    }
    const base = isUpper ? 65 : 97
    const kShift = k.charCodeAt(keyIdx % k.length) - 65
    const sign = mode === 'encrypt' ? 1 : -1
    const n = (((code - base + sign * kShift) % 26) + 26) % 26
    out += String.fromCharCode(n + base)
    keyIdx++
  }
  return out
}

export function vigenereSteps(text: string, key: string, mode: Mode = 'encrypt'): VigenereStep[] {
  const k = cleanKey(key)
  const out: VigenereStep[] = []
  if (k === '') return out
  let keyIdx = 0
  let i = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    const isUpper = code >= 65 && code <= 90
    const isLower = code >= 97 && code <= 122
    if (!isUpper && !isLower) {
      out.push({ index: i++, plain: ch, cipher: ch, keyLetter: null, shift: null })
      continue
    }
    const base = isUpper ? 65 : 97
    const kShift = k.charCodeAt(keyIdx % k.length) - 65
    const sign = mode === 'encrypt' ? 1 : -1
    const n = (((code - base + sign * kShift) % 26) + 26) % 26
    out.push({
      index: i++,
      plain: ch,
      cipher: String.fromCharCode(n + base),
      keyLetter: k[keyIdx % k.length],
      shift: kShift,
    })
    keyIdx++
  }
  return out
}
