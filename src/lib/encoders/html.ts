const NAMED: Record<string, string> = {
  '&': 'amp',
  '<': 'lt',
  '>': 'gt',
  '"': 'quot',
  "'": 'apos',
  ' ': 'nbsp',
  '©': 'copy',
  '®': 'reg',
  '™': 'trade',
  '€': 'euro',
  '£': 'pound',
  '¥': 'yen',
  '¢': 'cent',
  '§': 'sect',
  '¶': 'para',
  '°': 'deg',
  '±': 'plusmn',
  '×': 'times',
  '÷': 'divide',
  '¿': 'iquest',
  '¡': 'iexcl',
}

const NAMED_INVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(NAMED).map(([ch, name]) => [name, ch]),
)

export type HtmlEncodeMode = 'minimal' | 'named' | 'numeric'

export function htmlEncode(text: string, mode: HtmlEncodeMode = 'named'): string {
  let out = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    const isMandatory = ch === '&' || ch === '<' || ch === '>' || ch === '"' || ch === "'"

    if (mode === 'minimal') {
      out += isMandatory ? `&${NAMED[ch]};` : ch
      continue
    }

    const isControl = cp < 0x20 || cp === 0x7f
    const isNonAscii = cp > 0x7e

    if (!isMandatory && !isControl && !isNonAscii) {
      out += ch
      continue
    }

    if (mode === 'named' && NAMED[ch]) {
      out += `&${NAMED[ch]};`
    } else {
      out += `&#${cp};`
    }
  }
  return out
}

export function htmlDecode(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (full, body) => {
    if (typeof body !== 'string') return full
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X'
      const cp = parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10)
      if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return full
      try {
        return String.fromCodePoint(cp)
      } catch {
        return full
      }
    }
    return NAMED_INVERSE[body] ?? full
  })
}
