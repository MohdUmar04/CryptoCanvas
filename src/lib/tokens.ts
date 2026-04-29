import {
  CompactEncrypt,
  CompactSign,
  SignJWT,
  compactDecrypt,
  compactVerify,
  decodeJwt,
  decodeProtectedHeader,
  generateKeyPair,
  jwtVerify,
  type CompactJWSHeaderParameters,
  type JWTHeaderParameters,
  type JWTPayload,
} from 'jose'

export type JwtAlg = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'PS256' | 'ES256'
export type JwsAlg = JwtAlg
export type JweKeyAlg = 'RSA-OAEP' | 'RSA-OAEP-256'
export type JweEncAlg = 'A128GCM' | 'A256GCM'

export const HMAC_ALGS = new Set<JwtAlg>(['HS256', 'HS384', 'HS512'])

export type AnyKey = Uint8Array | CryptoKey
export type Pair = { publicKey: CryptoKey; privateKey: CryptoKey }

export async function generateAlgKeyPair(alg: Exclude<JwtAlg, 'HS256' | 'HS384' | 'HS512'>): Promise<Pair> {
  const kp = await generateKeyPair(alg, { extractable: true })
  return { publicKey: kp.publicKey, privateKey: kp.privateKey }
}

export async function generateJweKeyPair(alg: JweKeyAlg = 'RSA-OAEP-256'): Promise<Pair> {
  const kp = await generateKeyPair(alg, { extractable: true })
  return { publicKey: kp.publicKey, privateKey: kp.privateKey }
}

export async function signJwtToken(opts: {
  header: Record<string, unknown>
  payload: JWTPayload
  key: AnyKey
}): Promise<string> {
  const { header, payload, key } = opts
  return new SignJWT(payload).setProtectedHeader(header as JWTHeaderParameters).sign(key)
}

export type VerifiedJwt = {
  header: Record<string, unknown>
  payload: JWTPayload
}

export async function verifyJwtToken(token: string, key: AnyKey): Promise<VerifiedJwt> {
  const { protectedHeader, payload } = await jwtVerify(token, key)
  return { header: protectedHeader as Record<string, unknown>, payload }
}

export function decodeJwtParts(token: string): {
  header: unknown
  payload: unknown
  signature: string
} {
  const parts = token.split('.')
  if (parts.length < 2) return { header: null, payload: null, signature: '' }
  try {
    return {
      header: decodeProtectedHeader(token),
      payload: decodeJwt(token),
      signature: parts[2] ?? '',
    }
  } catch {
    return { header: null, payload: null, signature: parts[2] ?? '' }
  }
}

export async function signJws(opts: {
  header: Record<string, unknown>
  payload: Uint8Array
  key: AnyKey
}): Promise<string> {
  return new CompactSign(opts.payload)
    .setProtectedHeader(opts.header as CompactJWSHeaderParameters)
    .sign(opts.key)
}

export async function verifyJwsToken(
  token: string,
  key: AnyKey,
): Promise<{ header: Record<string, unknown>; payload: Uint8Array }> {
  const { protectedHeader, payload } = await compactVerify(token, key)
  return { header: protectedHeader as Record<string, unknown>, payload }
}

export async function encryptJwe(opts: {
  plaintext: Uint8Array
  publicKey: CryptoKey
  keyAlg: JweKeyAlg
  encAlg: JweEncAlg
}): Promise<string> {
  return new CompactEncrypt(opts.plaintext)
    .setProtectedHeader({ alg: opts.keyAlg, enc: opts.encAlg })
    .encrypt(opts.publicKey)
}

export async function decryptJwe(
  token: string,
  privateKey: CryptoKey,
): Promise<{ header: Record<string, unknown>; plaintext: Uint8Array }> {
  const { protectedHeader, plaintext } = await compactDecrypt(token, privateKey)
  return { header: protectedHeader as Record<string, unknown>, plaintext }
}

const enc = new TextEncoder()
const dec = new TextDecoder()

/** Sign a JWT, then encrypt it as the payload of a JWE (RFC 7519 §11.2 — nested JWT). */
export async function signThenEncryptJwt(opts: {
  signHeader: Record<string, unknown>
  payload: JWTPayload
  signKey: AnyKey
  encryptionPublicKey: CryptoKey
  keyAlg: JweKeyAlg
  encAlg: JweEncAlg
}): Promise<{ inner: string; outer: string }> {
  const inner = await new SignJWT(opts.payload)
    .setProtectedHeader(opts.signHeader as JWTHeaderParameters)
    .sign(opts.signKey)
  const outer = await new CompactEncrypt(new Uint8Array(enc.encode(inner)))
    .setProtectedHeader({ alg: opts.keyAlg, enc: opts.encAlg, cty: 'JWT' })
    .encrypt(opts.encryptionPublicKey)
  return { inner, outer }
}

/** Decrypt the outer JWE then verify the inner JWS/JWT. */
export async function decryptThenVerifyJwt(opts: {
  token: string
  decryptionPrivateKey: CryptoKey
  verifyKey: AnyKey
}): Promise<{
  outerHeader: Record<string, unknown>
  innerJwt: string
  innerHeader: Record<string, unknown>
  payload: JWTPayload
}> {
  const { protectedHeader: outerHeader, plaintext } = await compactDecrypt(
    opts.token,
    opts.decryptionPrivateKey,
  )
  const innerJwt = dec.decode(plaintext)
  const { header: innerHeader, payload } = await verifyJwtToken(innerJwt, opts.verifyKey)
  return {
    outerHeader: outerHeader as Record<string, unknown>,
    innerJwt,
    innerHeader,
    payload,
  }
}
