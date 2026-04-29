export function rot(text: string, shift: number): string {
  const n = ((shift % 26) + 26) % 26
  if (n === 0) return text
  let out = ''
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code >= 65 && code <= 90) {
      out += String.fromCharCode(((code - 65 + n) % 26) + 65)
    } else if (code >= 97 && code <= 122) {
      out += String.fromCharCode(((code - 97 + n) % 26) + 97)
    } else {
      out += ch
    }
  }
  return out
}
