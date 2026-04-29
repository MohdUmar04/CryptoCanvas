import { bytesToBase64 } from './bytes'

export type RsaPurpose = 'encrypt' | 'sign'
export type RsaSize = 2048 | 3072 | 4096
export type EcCurve = 'P-256' | 'P-384' | 'P-521'

export async function generateRsaKeyPair(size: RsaSize, purpose: RsaPurpose): Promise<CryptoKeyPair> {
  const algo: RsaHashedKeyGenParams =
    purpose === 'encrypt'
      ? {
          name: 'RSA-OAEP',
          modulusLength: size,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        }
      : {
          name: 'RSA-PSS',
          modulusLength: size,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        }
  const usages: KeyUsage[] = purpose === 'encrypt' ? ['encrypt', 'decrypt'] : ['sign', 'verify']
  return crypto.subtle.generateKey(algo, true, usages) as Promise<CryptoKeyPair>
}

export async function generateEcdsaKeyPair(curve: EcCurve = 'P-256'): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: curve }, true, [
    'sign',
    'verify',
  ]) as Promise<CryptoKeyPair>
}

export async function exportKeyPem(
  key: CryptoKey,
  visibility: 'public' | 'private',
): Promise<string> {
  const format = visibility === 'public' ? 'spki' : 'pkcs8'
  const buf = await crypto.subtle.exportKey(format, key)
  const b64 = bytesToBase64(new Uint8Array(buf))
  const label = visibility === 'public' ? 'PUBLIC KEY' : 'PRIVATE KEY'
  const lines = b64.match(/.{1,64}/g) ?? []
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`
}

export async function exportKeyJwk(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey('jwk', key)
  return JSON.stringify(jwk, null, 2)
}

export async function rsaOaepEncrypt(publicKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const buf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data as BufferSource)
  return new Uint8Array(buf)
}

export async function rsaOaepDecrypt(
  privateKey: CryptoKey,
  ciphertext: Uint8Array,
): Promise<Uint8Array> {
  const buf = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    ciphertext as BufferSource,
  )
  return new Uint8Array(buf)
}

export async function rsaPssSign(
  privateKey: CryptoKey,
  data: Uint8Array,
  saltLength = 32,
): Promise<Uint8Array> {
  const buf = await crypto.subtle.sign(
    { name: 'RSA-PSS', saltLength },
    privateKey,
    data as BufferSource,
  )
  return new Uint8Array(buf)
}

export async function rsaPssVerify(
  publicKey: CryptoKey,
  signature: Uint8Array,
  data: Uint8Array,
  saltLength = 32,
): Promise<boolean> {
  return crypto.subtle.verify(
    { name: 'RSA-PSS', saltLength },
    publicKey,
    signature as BufferSource,
    data as BufferSource,
  )
}

export async function ecdsaSign(
  privateKey: CryptoKey,
  data: Uint8Array,
  hash: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
): Promise<Uint8Array> {
  const buf = await crypto.subtle.sign(
    { name: 'ECDSA', hash },
    privateKey,
    data as BufferSource,
  )
  return new Uint8Array(buf)
}

export async function ecdsaVerify(
  publicKey: CryptoKey,
  signature: Uint8Array,
  data: Uint8Array,
  hash: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
): Promise<boolean> {
  return crypto.subtle.verify(
    { name: 'ECDSA', hash },
    publicKey,
    signature as BufferSource,
    data as BufferSource,
  )
}
