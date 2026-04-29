import { describe, expect, it } from 'vitest'
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@/lib/bytes'
import { aesDecrypt, aesEncrypt, generateAesKey, generateIv } from '@/lib/symmetric'

describe('aes-gcm', () => {
  it('round-trips a message', async () => {
    const key = generateAesKey(256)
    const iv = generateIv('AES-GCM')
    const plaintext = utf8ToBytes('Hello, AES-GCM 🚀')
    const enc = await aesEncrypt({ mode: 'AES-GCM', key, iv, plaintext })
    expect(enc.tag?.length).toBe(16)
    const dec = await aesDecrypt({
      mode: 'AES-GCM',
      key,
      iv,
      ciphertext: enc.ciphertext,
      tag: enc.tag,
    })
    expect(bytesToUtf8(dec)).toBe('Hello, AES-GCM 🚀')
  })

  it('rejects tampered ciphertext', async () => {
    const key = generateAesKey(128)
    const iv = generateIv('AES-GCM')
    const enc = await aesEncrypt({
      mode: 'AES-GCM',
      key,
      iv,
      plaintext: utf8ToBytes('do not tamper'),
    })
    const tampered = new Uint8Array(enc.ciphertext)
    tampered[0] ^= 0xff
    await expect(
      aesDecrypt({ mode: 'AES-GCM', key, iv, ciphertext: tampered, tag: enc.tag }),
    ).rejects.toThrow()
  })

  it('AAD must match on decrypt', async () => {
    const key = generateAesKey(192)
    const iv = generateIv('AES-GCM')
    const enc = await aesEncrypt({
      mode: 'AES-GCM',
      key,
      iv,
      plaintext: utf8ToBytes('msg'),
      aad: utf8ToBytes('v1'),
    })
    await expect(
      aesDecrypt({
        mode: 'AES-GCM',
        key,
        iv,
        ciphertext: enc.ciphertext,
        tag: enc.tag,
        aad: utf8ToBytes('v2'),
      }),
    ).rejects.toThrow()
  })
})

describe('aes-cbc', () => {
  it('round-trips', async () => {
    const key = generateAesKey(256)
    const iv = generateIv('AES-CBC')
    const plaintext = utf8ToBytes('CBC mode demo')
    const enc = await aesEncrypt({ mode: 'AES-CBC', key, iv, plaintext })
    expect(enc.tag).toBeUndefined()
    const dec = await aesDecrypt({ mode: 'AES-CBC', key, iv, ciphertext: enc.ciphertext })
    expect(bytesToUtf8(dec)).toBe('CBC mode demo')
  })
})

describe('validation', () => {
  it('rejects wrong-length key', async () => {
    await expect(
      aesEncrypt({
        mode: 'AES-GCM',
        key: hexToBytes('00'.repeat(15)),
        iv: hexToBytes('00'.repeat(12)),
        plaintext: utf8ToBytes('x'),
      }),
    ).rejects.toThrow()
  })

  it('rejects wrong-length IV', async () => {
    await expect(
      aesEncrypt({
        mode: 'AES-GCM',
        key: hexToBytes('00'.repeat(16)),
        iv: hexToBytes('00'.repeat(11)),
        plaintext: utf8ToBytes('x'),
      }),
    ).rejects.toThrow()
  })

  it('hex round-trips for keys', () => {
    const key = generateAesKey(256)
    expect(hexToBytes(bytesToHex(key))).toEqual(key)
  })
})
