export type Mode = 'encrypt' | 'decrypt'

export type CaesarStep = {
  index: number
  plain: string
  cipher: string
  shift: number | null
}

function shiftLetter(ch: string, n: number): string {
  const code = ch.charCodeAt(0)
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(((code - 65 + n + 26) % 26) + 65)
  }
  if (code >= 97 && code <= 122) {
    return String.fromCharCode(((code - 97 + n + 26) % 26) + 97)
  }
  return ch
}

export function caesar(text: string, shift: number, mode: Mode = 'encrypt'): string {
  const sign = mode === 'encrypt' ? 1 : -1
  const n = ((sign * shift) % 26 + 26) % 26
  if (n === 0) return text
  let out = ''
  for (const ch of text) out += shiftLetter(ch, n)
  return out
}

export function caesarSteps(text: string, shift: number, mode: Mode = 'encrypt'): CaesarStep[] {
  const sign = mode === 'encrypt' ? 1 : -1
  const n = ((sign * shift) % 26 + 26) % 26
  const out: CaesarStep[] = []
  let i = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    const isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
    out.push({
      index: i++,
      plain: ch,
      cipher: shiftLetter(ch, n),
      shift: isLetter ? n : null,
    })
  }
  return out
}
