import { describe, expect, it } from 'vitest'
import { caesar, caesarSteps } from '@/lib/ciphers/caesar'
import { vigenere, vigenereSteps } from '@/lib/ciphers/vigenere'
import { xorBytes } from '@/lib/ciphers/xor'
import { bytesToHex, hexToBytes, utf8ToBytes } from '@/lib/bytes'

describe('caesar', () => {
  it('shift 3 of HELLO is KHOOR', () => {
    expect(caesar('HELLO', 3)).toBe('KHOOR')
  })
  it('decrypt undoes encrypt', () => {
    expect(caesar(caesar('Hello, World!', 7), 7, 'decrypt')).toBe('Hello, World!')
  })
  it('non-letters pass through', () => {
    expect(caesar('A.B 1', 1)).toBe('B.C 1')
  })
  it('caesarSteps records shift per letter', () => {
    const steps = caesarSteps('A B', 1)
    expect(steps.map((s) => s.cipher).join('')).toBe('B C')
    expect(steps[1].shift).toBeNull() // space
  })
})

describe('vigenere', () => {
  it('classic test vector ATTACKATDAWN with LEMON', () => {
    expect(vigenere('ATTACKATDAWN', 'LEMON')).toBe('LXFOPVEFRNHR')
  })
  it('decrypt undoes encrypt', () => {
    expect(vigenere(vigenere('Hello, World!', 'CRYPTO'), 'CRYPTO', 'decrypt')).toBe('Hello, World!')
  })
  it('rejects empty key', () => {
    expect(() => vigenere('hi', '')).toThrow()
    expect(() => vigenere('hi', '!!!')).toThrow()
  })
  it('vigenereSteps reports key letter and shift', () => {
    const steps = vigenereSteps('AB', 'BC')
    expect(steps[0].keyLetter).toBe('B')
    expect(steps[0].shift).toBe(1)
    expect(steps[0].cipher).toBe('B')
    expect(steps[1].keyLetter).toBe('C')
    expect(steps[1].shift).toBe(2)
    expect(steps[1].cipher).toBe('D')
  })
})

describe('xor', () => {
  it('A XOR A = zeroes', () => {
    const a = utf8ToBytes('Hello')
    const out = xorBytes(a, a)
    expect(bytesToHex(out)).toBe('0000000000')
  })
  it('round-trip with repeating key', () => {
    const data = utf8ToBytes('Hello, world! 🚀')
    const key = utf8ToBytes('K3y')
    const enc = xorBytes(data, key)
    const dec = xorBytes(enc, key)
    expect(bytesToHex(dec)).toBe(bytesToHex(data))
  })
  it('rejects empty key', () => {
    expect(() => xorBytes(utf8ToBytes('a'), new Uint8Array(0))).toThrow()
  })
  it('hex util round-trip', () => {
    expect(bytesToHex(hexToBytes('48 65 6C 6C 6F'))).toBe('48656c6c6f')
  })
})
