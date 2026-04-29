// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { bytesToUtf8, utf8ToBytes } from '@/lib/bytes'
import {
  decodeJwtParts,
  decryptJwe,
  decryptThenVerifyJwt,
  encryptJwe,
  generateAlgKeyPair,
  generateJweKeyPair,
  signJws,
  signJwtToken,
  signThenEncryptJwt,
  verifyJwsToken,
  verifyJwtToken,
  type Pair,
} from '@/lib/tokens'

describe('jwt (HS256)', () => {
  const secret = utf8ToBytes('shared-secret-for-tests')

  it('signs and verifies a payload', async () => {
    const token = await signJwtToken({
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: 'abc', n: 1 },
      key: secret,
    })
    expect(token.split('.').length).toBe(3)
    const { payload } = await verifyJwtToken(token, secret)
    expect(payload.sub).toBe('abc')
  })

  it('rejects a tampered payload', async () => {
    const token = await signJwtToken({
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: 'abc' },
      key: secret,
    })
    const parts = token.split('.')
    const tampered = parts[0] + '.' + parts[1] + 'a.' + parts[2]
    await expect(verifyJwtToken(tampered, secret)).rejects.toThrow()
  })

  it('decodeJwtParts returns header and payload without verifying', () => {
    const decoded = decodeJwtParts(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmMifQ.signature',
    )
    expect((decoded.header as { alg: string }).alg).toBe('HS256')
    expect((decoded.payload as { sub: string }).sub).toBe('abc')
  })
})

describe('jwt (RS256)', () => {
  let kp: Pair
  beforeAll(async () => {
    kp = await generateAlgKeyPair('RS256')
  }, 60_000)

  it('signs with private key, verifies with public', async () => {
    const token = await signJwtToken({
      header: { alg: 'RS256', typ: 'JWT' },
      payload: { sub: 'rs256-test' },
      key: kp.privateKey,
    })
    const { payload } = await verifyJwtToken(token, kp.publicKey)
    expect(payload.sub).toBe('rs256-test')
  })
})

describe('jws', () => {
  it('signs arbitrary bytes and verifies them', async () => {
    const secret = utf8ToBytes('jws-secret')
    const token = await signJws({
      header: { alg: 'HS256' },
      payload: utf8ToBytes('arbitrary bytes'),
      key: secret,
    })
    const { payload } = await verifyJwsToken(token, secret)
    expect(bytesToUtf8(payload)).toBe('arbitrary bytes')
  })
})

describe('jwe', () => {
  let kp: Pair
  beforeAll(async () => {
    kp = await generateJweKeyPair('RSA-OAEP-256')
  }, 60_000)

  it('encrypts and decrypts via RSA-OAEP-256 + A256GCM', async () => {
    const token = await encryptJwe({
      plaintext: utf8ToBytes('top secret'),
      publicKey: kp.publicKey,
      keyAlg: 'RSA-OAEP-256',
      encAlg: 'A256GCM',
    })
    expect(token.split('.').length).toBe(5)
    const { plaintext } = await decryptJwe(token, kp.privateKey)
    expect(bytesToUtf8(plaintext)).toBe('top secret')
  })
})

describe('nested jwt (sign then encrypt)', () => {
  let signKp: Pair
  let encKp: Pair
  beforeAll(async () => {
    ;[signKp, encKp] = await Promise.all([
      generateAlgKeyPair('RS256'),
      generateJweKeyPair('RSA-OAEP-256'),
    ])
  }, 90_000)

  it('produces a 5-part outer JWE that decrypts to a verifiable inner JWS', async () => {
    const { inner, outer } = await signThenEncryptJwt({
      signHeader: { alg: 'RS256', typ: 'JWT' },
      payload: { sub: 'alice', msg: 'top secret' },
      signKey: signKp.privateKey,
      encryptionPublicKey: encKp.publicKey,
      keyAlg: 'RSA-OAEP-256',
      encAlg: 'A256GCM',
    })
    expect(inner.split('.').length).toBe(3)
    expect(outer.split('.').length).toBe(5)

    const r = await decryptThenVerifyJwt({
      token: outer,
      decryptionPrivateKey: encKp.privateKey,
      verifyKey: signKp.publicKey,
    })
    expect(r.innerJwt).toBe(inner)
    expect(r.payload.sub).toBe('alice')
    expect(r.outerHeader.cty).toBe('JWT')
  })

  it('rejects when the outer JWE is decrypted with the wrong key', async () => {
    const { outer } = await signThenEncryptJwt({
      signHeader: { alg: 'RS256', typ: 'JWT' },
      payload: { sub: 'bob' },
      signKey: signKp.privateKey,
      encryptionPublicKey: encKp.publicKey,
      keyAlg: 'RSA-OAEP-256',
      encAlg: 'A256GCM',
    })
    const otherEnc = await generateJweKeyPair('RSA-OAEP-256')
    await expect(
      decryptThenVerifyJwt({
        token: outer,
        decryptionPrivateKey: otherEnc.privateKey,
        verifyKey: signKp.publicKey,
      }),
    ).rejects.toThrow()
  })
})
