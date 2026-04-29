import { describe, expect, it } from 'vitest'
import { bytesToHex, utf8ToBytes } from '@/lib/bytes'
import { digest, diffBytes, flipLastBit, hmac } from '@/lib/hashing'

describe('digest', () => {
  it('SHA-256 of empty string', async () => {
    const d = await digest('SHA-256', new Uint8Array(0))
    expect(bytesToHex(d)).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('SHA-1 of empty string', async () => {
    const d = await digest('SHA-1', new Uint8Array(0))
    expect(bytesToHex(d)).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
  })

  it('MD5 of empty string', async () => {
    const d = await digest('MD5', new Uint8Array(0))
    expect(bytesToHex(d)).toBe('d41d8cd98f00b204e9800998ecf8427e')
  })

  it('SHA-256 of "abc"', async () => {
    const d = await digest('SHA-256', utf8ToBytes('abc'))
    expect(bytesToHex(d)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('hmac', () => {
  it('HMAC-SHA-256 with key "key" and famous fox sentence', async () => {
    const sig = await hmac(
      'HMAC-SHA-256',
      utf8ToBytes('key'),
      utf8ToBytes('The quick brown fox jumps over the lazy dog'),
    )
    expect(bytesToHex(sig)).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    )
  })

  it('HMAC-SHA-1 RFC 2202 vector', async () => {
    const key = new Uint8Array(20).fill(0x0b)
    const sig = await hmac('HMAC-SHA-1', key, utf8ToBytes('Hi There'))
    expect(bytesToHex(sig)).toBe('b617318655057264e28bc0b6fb378c8ef146be00')
  })
})

describe('avalanche helpers', () => {
  it('flipLastBit changes one bit', () => {
    const a = utf8ToBytes('hello')
    const b = flipLastBit(a)
    expect(b.length).toBe(a.length)
    expect(b[b.length - 1]).toBe(a[a.length - 1] ^ 1)
  })

  it('diffBytes counts byte and bit differences', () => {
    const a = new Uint8Array([0x00, 0xff, 0xaa])
    const b = new Uint8Array([0x00, 0x00, 0xab])
    const d = diffBytes(a, b)
    expect(d.bytesDiffering).toBe(2)
    expect(d.bitsDiffering).toBe(8 + 1) // 0xff differs in 8 bits, last byte 1 bit
    expect(d.diffPositions).toEqual([false, true, true])
  })
})
