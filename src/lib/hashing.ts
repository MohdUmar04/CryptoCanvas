import { md5 } from '@noble/hashes/legacy.js'

export type HashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
export const HASH_ALGOS: HashAlgo[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

export const HASH_OUTPUT_BYTES: Record<HashAlgo, number> = {
  MD5: 16,
  'SHA-1': 20,
  'SHA-256': 32,
  'SHA-384': 48,
  'SHA-512': 64,
}

export async function digest(algo: HashAlgo, data: Uint8Array): Promise<Uint8Array> {
  if (algo === 'MD5') return md5(data)
  const buf = await crypto.subtle.digest(algo, data as BufferSource)
  return new Uint8Array(buf)
}

export type HmacAlgo = 'HMAC-SHA-1' | 'HMAC-SHA-256' | 'HMAC-SHA-384' | 'HMAC-SHA-512'
export const HMAC_ALGOS: HmacAlgo[] = [
  'HMAC-SHA-1',
  'HMAC-SHA-256',
  'HMAC-SHA-384',
  'HMAC-SHA-512',
]

const HMAC_HASH_NAME: Record<HmacAlgo, string> = {
  'HMAC-SHA-1': 'SHA-1',
  'HMAC-SHA-256': 'SHA-256',
  'HMAC-SHA-384': 'SHA-384',
  'HMAC-SHA-512': 'SHA-512',
}

export async function hmac(
  algo: HmacAlgo,
  key: Uint8Array,
  data: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: HMAC_HASH_NAME[algo] },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data as BufferSource)
  return new Uint8Array(sig)
}

/** Flip one specific bit (bitIndex 0 = least significant) of one byte. */
export function flipBit(bytes: Uint8Array, byteIndex: number, bitIndex: number): Uint8Array {
  if (bytes.length === 0) return new Uint8Array([1 << (bitIndex & 7)])
  const out = new Uint8Array(bytes)
  const i = Math.min(Math.max(byteIndex, 0), out.length - 1)
  out[i] ^= 1 << (bitIndex & 7)
  return out
}

export function flipLastBit(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 0) return new Uint8Array([1])
  const out = new Uint8Array(bytes)
  out[out.length - 1] ^= 0x01
  return out
}

export type ByteDiff = {
  bytesDiffering: number
  bitsDiffering: number
  totalBits: number
  diffPositions: boolean[]
}

export function diffBytes(a: Uint8Array, b: Uint8Array): ByteDiff {
  const len = Math.max(a.length, b.length)
  const diffPositions = new Array<boolean>(len).fill(false)
  let bytesDiffering = 0
  let bitsDiffering = 0
  for (let i = 0; i < len; i++) {
    const ax = i < a.length ? a[i] : 0
    const bx = i < b.length ? b[i] : 0
    if (ax !== bx) {
      bytesDiffering++
      diffPositions[i] = true
      let xor = ax ^ bx
      while (xor) {
        bitsDiffering += xor & 1
        xor >>>= 1
      }
    }
  }
  return { bytesDiffering, bitsDiffering, totalBits: len * 8, diffPositions }
}
