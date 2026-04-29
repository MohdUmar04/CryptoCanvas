export function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length === 0) throw new Error('Key cannot be empty.')
  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ key[i % key.length]
  }
  return out
}
