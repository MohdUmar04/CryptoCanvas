import { describe, expect, it } from 'vitest'
import { aesEncryptBlockSteps } from '@/lib/aes-rounds'
import { bytesToHex, hexToBytes } from '@/lib/bytes'

// FIPS-197 Appendix C test vectors
describe('aes-rounds (teaching impl)', () => {
  it('AES-128: matches FIPS-197 Appendix C.1 vector', () => {
    const pt = hexToBytes('00112233445566778899aabbccddeeff')
    const key = hexToBytes('000102030405060708090a0b0c0d0e0f')
    const steps = aesEncryptBlockSteps(pt, key)
    const final = steps[steps.length - 1].state
    expect(bytesToHex(final)).toBe('69c4e0d86a7b0430d8cdb78070b4c55a')
    // 1 init + 9 rounds * 4 ops + 3 final ops = 1 + 36 + 3 = 40 steps
    expect(steps.length).toBe(40)
  })

  it('AES-192: matches FIPS-197 Appendix C.2 vector', () => {
    const pt = hexToBytes('00112233445566778899aabbccddeeff')
    const key = hexToBytes('000102030405060708090a0b0c0d0e0f1011121314151617')
    const steps = aesEncryptBlockSteps(pt, key)
    expect(bytesToHex(steps[steps.length - 1].state)).toBe('dda97ca4864cdfe06eaf70a0ec0d7191')
    // 1 + 11 * 4 + 3 = 48
    expect(steps.length).toBe(48)
  })

  it('AES-256: matches FIPS-197 Appendix C.3 vector', () => {
    const pt = hexToBytes('00112233445566778899aabbccddeeff')
    const key = hexToBytes(
      '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    )
    const steps = aesEncryptBlockSteps(pt, key)
    expect(bytesToHex(steps[steps.length - 1].state)).toBe('8ea2b7ca516745bfeafc49904b496089')
    // 1 + 13 * 4 + 3 = 56
    expect(steps.length).toBe(56)
  })

  it('rejects non-16-byte block', () => {
    expect(() => aesEncryptBlockSteps(new Uint8Array(10), new Uint8Array(16))).toThrow()
  })

  it('rejects bad key length', () => {
    expect(() => aesEncryptBlockSteps(new Uint8Array(16), new Uint8Array(20))).toThrow()
  })
})
