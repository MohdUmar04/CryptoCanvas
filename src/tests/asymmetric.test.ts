import { beforeAll, describe, expect, it } from 'vitest'
import { bytesToUtf8, utf8ToBytes } from '@/lib/bytes'
import {
  ecdsaSign,
  ecdsaVerify,
  exportKeyJwk,
  exportKeyPem,
  generateEcdsaKeyPair,
  generateRsaKeyPair,
  rsaOaepDecrypt,
  rsaOaepEncrypt,
  rsaPssSign,
  rsaPssVerify,
} from '@/lib/asymmetric'

describe('rsa', () => {
  let encKp: CryptoKeyPair
  let signKp: CryptoKeyPair

  beforeAll(async () => {
    encKp = await generateRsaKeyPair(2048, 'encrypt')
    signKp = await generateRsaKeyPair(2048, 'sign')
  }, 60_000)

  it('OAEP round-trips short messages', async () => {
    const ct = await rsaOaepEncrypt(encKp.publicKey, utf8ToBytes('Hello, RSA!'))
    const pt = await rsaOaepDecrypt(encKp.privateKey, ct)
    expect(bytesToUtf8(pt)).toBe('Hello, RSA!')
  })

  it('PSS verify accepts a valid signature and rejects tampering', async () => {
    const msg = utf8ToBytes('signed and sealed')
    const sig = await rsaPssSign(signKp.privateKey, msg)
    expect(await rsaPssVerify(signKp.publicKey, sig, msg)).toBe(true)
    const tampered = utf8ToBytes('signed and sealEd')
    expect(await rsaPssVerify(signKp.publicKey, sig, tampered)).toBe(false)
  })

  it('exports public PEM begins with the right banner', async () => {
    const pem = await exportKeyPem(encKp.publicKey, 'public')
    expect(pem.startsWith('-----BEGIN PUBLIC KEY-----')).toBe(true)
    expect(pem.endsWith('-----END PUBLIC KEY-----')).toBe(true)
  })

  it('exports JWK as parseable JSON', async () => {
    const jwk = await exportKeyJwk(encKp.publicKey)
    const parsed = JSON.parse(jwk)
    expect(parsed.kty).toBe('RSA')
  })
})

describe('ecdsa', () => {
  it('P-256 sign/verify round-trip', async () => {
    const kp = await generateEcdsaKeyPair('P-256')
    const msg = utf8ToBytes('elliptic curves are tiny and tasty')
    const sig = await ecdsaSign(kp.privateKey, msg, 'SHA-256')
    expect(await ecdsaVerify(kp.publicKey, sig, msg, 'SHA-256')).toBe(true)
    expect(
      await ecdsaVerify(kp.publicKey, sig, utf8ToBytes('different'), 'SHA-256'),
    ).toBe(false)
  })
})
