import { concatBytes, randomBytes } from './bytes'

export type AesMode = 'AES-GCM' | 'AES-CBC'
export type KeySizeBits = 128 | 192 | 256

export const KEY_SIZES_BYTES: Record<KeySizeBits, number> = { 128: 16, 192: 24, 256: 32 }

export function ivLengthFor(mode: AesMode): number {
  return mode === 'AES-GCM' ? 12 : 16
}

export function generateAesKey(bits: KeySizeBits): Uint8Array {
  return randomBytes(KEY_SIZES_BYTES[bits])
}

export function generateIv(mode: AesMode): Uint8Array {
  return randomBytes(ivLengthFor(mode))
}

function validateKey(key: Uint8Array) {
  if (![16, 24, 32].includes(key.length)) {
    throw new Error(`AES key must be 16, 24, or 32 bytes (got ${key.length}).`)
  }
}

function validateIv(mode: AesMode, iv: Uint8Array) {
  const expected = ivLengthFor(mode)
  if (iv.length !== expected) {
    throw new Error(
      `${mode} requires a ${expected}-byte ${mode === 'AES-GCM' ? 'nonce' : 'IV'} (got ${iv.length}).`,
    )
  }
}

export type AesEncryptResult = {
  ciphertext: Uint8Array
  /** GCM only — the 16-byte authentication tag (split off the end). */
  tag?: Uint8Array
  iv: Uint8Array
  mode: AesMode
}

export async function aesEncrypt(opts: {
  mode: AesMode
  key: Uint8Array
  iv: Uint8Array
  plaintext: Uint8Array
  aad?: Uint8Array
}): Promise<AesEncryptResult> {
  const { mode, key, iv, plaintext, aad } = opts
  validateKey(key)
  validateIv(mode, iv)

  const cryptoKey = await crypto.subtle.importKey('raw', key as BufferSource, mode, false, ['encrypt'])
  const params: AesGcmParams | AesCbcParams =
    mode === 'AES-GCM'
      ? aad
        ? ({ name: 'AES-GCM', iv: iv as BufferSource, additionalData: aad as BufferSource } as AesGcmParams)
        : ({ name: 'AES-GCM', iv: iv as BufferSource } as AesGcmParams)
      : ({ name: 'AES-CBC', iv: iv as BufferSource } as AesCbcParams)
  const out = new Uint8Array(await crypto.subtle.encrypt(params, cryptoKey, plaintext as BufferSource))
  if (mode === 'AES-GCM') {
    const tagLen = 16
    return {
      mode,
      iv,
      ciphertext: out.slice(0, out.length - tagLen),
      tag: out.slice(out.length - tagLen),
    }
  }
  return { mode, iv, ciphertext: out }
}

export async function aesDecrypt(opts: {
  mode: AesMode
  key: Uint8Array
  iv: Uint8Array
  ciphertext: Uint8Array
  /** GCM only. */
  tag?: Uint8Array
  aad?: Uint8Array
}): Promise<Uint8Array> {
  const { mode, key, iv, ciphertext, tag, aad } = opts
  validateKey(key)
  validateIv(mode, iv)

  const cryptoKey = await crypto.subtle.importKey('raw', key as BufferSource, mode, false, ['decrypt'])
  let payload = ciphertext
  if (mode === 'AES-GCM') {
    if (!tag || tag.length !== 16) throw new Error('GCM requires a 16-byte authentication tag.')
    payload = concatBytes(ciphertext, tag)
  }
  const params: AesGcmParams | AesCbcParams =
    mode === 'AES-GCM'
      ? aad
        ? ({ name: 'AES-GCM', iv: iv as BufferSource, additionalData: aad as BufferSource } as AesGcmParams)
        : ({ name: 'AES-GCM', iv: iv as BufferSource } as AesGcmParams)
      : ({ name: 'AES-CBC', iv: iv as BufferSource } as AesCbcParams)
  try {
    const out = await crypto.subtle.decrypt(params, cryptoKey, payload as BufferSource)
    return new Uint8Array(out)
  } catch {
    throw new Error('Decryption failed — wrong key, IV, tampered ciphertext, or bad auth tag.')
  }
}
