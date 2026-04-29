const enc = new TextEncoder()
const dec = new TextDecoder()

export function textToBase64(text: string, urlSafe = false): string {
  if (text === '') return ''
  const bytes = enc.encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  let out = btoa(bin)
  if (urlSafe) {
    out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  return out
}

export function base64ToText(input: string, _urlSafe = false): string {
  const trimmed = input.trim()
  if (trimmed === '') return ''
  let s = trimmed.replace(/\s+/g, '')
  // Auto-detect URL-safe alphabet
  if (/[-_]/.test(s)) {
    s = s.replace(/-/g, '+').replace(/_/g, '/')
  }
  // Pad to multiple of 4
  while (s.length % 4) s += '='
  let bin: string
  try {
    bin = atob(s)
  } catch {
    throw new Error('Input is not valid Base64.')
  }
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return dec.decode(bytes)
}
