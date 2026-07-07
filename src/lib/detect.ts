export type FormatSuggestion = {
  toolId: string
  label: string
  /** Which query param of the target tool should carry the value. */
  param: 'in' | 'enc'
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const JWT_RE = /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]*$/
const EPOCH_RE = /^\d{10}(\d{3}){0,3}$/
const BINARY_RE = /^[01]+([ \n\r\t]+[01]+)*$/
const MORSE_RE = /^[.-]{1,7}([ /]+[.-]{1,7})*$/
const B64_STD_RE = /^[A-Za-z0-9+/\s]+={0,2}$/

function looksLikeJwtHeader(segment: string): boolean {
  try {
    const b64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='))
    return json.startsWith('{') && json.includes('alg')
  } catch {
    return false
  }
}

/**
 * Guess what format a pasted string is in, most confident first.
 * Heuristics only — meant to power a "did you mean this tool?" hint.
 */
export function detectFormats(raw: string): FormatSuggestion[] {
  const input = raw.trim()
  if (input.length < 4) return []
  const out: FormatSuggestion[] = []

  if (UUID_RE.test(input)) {
    out.push({ toolId: 'uuid', label: 'a UUID', param: 'in' })
  }
  if (JWT_RE.test(input) && looksLikeJwtHeader(input.split('.')[0])) {
    out.push({ toolId: 'jwt', label: 'a JWT', param: 'in' })
  }
  if (EPOCH_RE.test(input)) {
    out.push({ toolId: 'time', label: 'an epoch timestamp', param: 'in' })
  }
  if (BINARY_RE.test(input) && input.replace(/\s/g, '').length % 8 === 0) {
    out.push({ toolId: 'binary', label: 'binary', param: 'enc' })
  }
  if (MORSE_RE.test(input)) {
    out.push({ toolId: 'morse', label: 'Morse code', param: 'enc' })
  }
  const hexish = input.replace(/(0x|:|\s)+/gi, '')
  if (
    hexish.length >= 6 &&
    hexish.length % 2 === 0 &&
    /^[0-9a-f]+$/i.test(hexish) &&
    /[a-f]/i.test(hexish)
  ) {
    out.push({ toolId: 'hex', label: 'hex bytes', param: 'enc' })
  }
  if (/%[0-9a-f]{2}/i.test(input)) {
    out.push({ toolId: 'url', label: 'URL-encoded text', param: 'enc' })
  }
  const compact = input.replace(/\s/g, '')
  if (
    compact.length >= 12 &&
    compact.length % 4 === 0 &&
    B64_STD_RE.test(input) &&
    (/[+/=]/.test(compact) || (/\d/.test(compact) && /[a-z]/.test(compact) && /[A-Z]/.test(compact)))
  ) {
    out.push({ toolId: 'base64', label: 'Base64', param: 'enc' })
  }

  return out
}
