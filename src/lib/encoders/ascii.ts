export function textToAsciiDec(text: string): string {
  return [...text].map((c) => c.codePointAt(0)!.toString()).join(' ')
}

export function asciiDecToText(input: string): string {
  const parts = input.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  return parts
    .map((p) => {
      const n = Number(p)
      if (!Number.isInteger(n) || n < 0 || n > 0x10ffff) {
        throw new Error(`Not a valid code point: "${p}"`)
      }
      return String.fromCodePoint(n)
    })
    .join('')
}

export function textToAsciiHex(text: string): string {
  return [...text]
    .map((c) => c.codePointAt(0)!.toString(16).padStart(2, '0').toUpperCase())
    .join(' ')
}

export function asciiHexToText(input: string): string {
  const parts = input.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  return parts
    .map((p) => {
      if (!/^[0-9a-fA-F]+$/.test(p)) throw new Error(`Not a hex value: "${p}"`)
      const n = parseInt(p, 16)
      if (n > 0x10ffff) throw new Error(`Code point out of range: "${p}"`)
      return String.fromCodePoint(n)
    })
    .join('')
}
