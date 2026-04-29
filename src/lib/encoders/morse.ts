export const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', _: '..--.-',
  '"': '.-..-.', $: '...-..-', '@': '.--.-.',
}

const REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))

export function textToMorse(text: string): string {
  const t = text.trim().toUpperCase()
  if (t === '') return ''
  return t
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part) => {
      if (/^\s+$/.test(part)) return '/'
      return [...part]
        .map((ch) => MORSE[ch] ?? '')
        .filter(Boolean)
        .join(' ')
    })
    .join(' ')
}

export function morseToText(morse: string): string {
  const t = morse.trim()
  if (t === '') return ''
  if (!/^[.\-/\s]+$/.test(t)) throw new Error('Morse must contain only ., -, /, and whitespace.')
  const words = t.split(/\s*\/\s*|\s{3,}/)
  return words
    .map((w) =>
      w
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => {
          if (!REV[code]) throw new Error(`Unknown Morse code: "${code}"`)
          return REV[code]
        })
        .join(''),
    )
    .filter(Boolean)
    .join(' ')
}
