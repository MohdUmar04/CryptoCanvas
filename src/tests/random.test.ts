import { describe, expect, it } from 'vitest'
import { generateEd25519Pair, generatePassword } from '@/lib/random'

describe('generatePassword', () => {
  it('honors length', () => {
    const pw = generatePassword({ length: 24, lower: true, upper: true, digits: true, symbols: false })
    expect(pw.length).toBe(24)
  })

  it('rejects when no charset is selected', () => {
    expect(() =>
      generatePassword({ length: 16, lower: false, upper: false, digits: false, symbols: false }),
    ).toThrow()
  })

  it('produces unique passwords across calls', () => {
    const a = generatePassword({ length: 32, lower: true, upper: true, digits: true, symbols: true })
    const b = generatePassword({ length: 32, lower: true, upper: true, digits: true, symbols: true })
    expect(a).not.toBe(b)
  })

  it('respects digit-only charset', () => {
    const pw = generatePassword({ length: 12, lower: false, upper: false, digits: true, symbols: false })
    expect(pw).toMatch(/^[0-9]+$/)
  })
})

describe('generateEd25519Pair', () => {
  it('produces a 32-byte private key and 32-byte public key', () => {
    const { publicKey, privateKey } = generateEd25519Pair()
    expect(privateKey.length).toBe(32)
    expect(publicKey.length).toBe(32)
  })

  it('returns different keys per call', () => {
    const a = generateEd25519Pair()
    const b = generateEd25519Pair()
    expect(a.privateKey).not.toEqual(b.privateKey)
  })
})
