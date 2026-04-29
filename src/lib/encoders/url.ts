export function urlEncode(text: string): string {
  return encodeURIComponent(text)
}

export function urlDecode(text: string): string {
  try {
    return decodeURIComponent(text)
  } catch {
    throw new Error('Input contains a malformed percent-encoded sequence.')
  }
}
