import { describe, expect, it } from 'vitest'
import { caesar } from '@/lib/ciphers/caesar'
import { vigenere } from '@/lib/ciphers/vigenere'
import {
  crackVigenere,
  estimateKeyLengths,
  indexOfCoincidence,
  letterCounts,
  letterFrequencies,
  rankShifts,
} from '@/lib/ciphers/frequency'
import { detectFormats } from '@/lib/detect'
import { derivePbkdf2, deriveScrypt, timeDerivation } from '@/lib/kdf'
import { flipBit } from '@/lib/hashing'

const ENGLISH_SAMPLE =
  'It was a bright cold day in April, and the clocks were striking thirteen. ' +
  'Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, ' +
  'slipped quickly through the glass doors of Victory Mansions, though not quickly enough ' +
  'to prevent a swirl of gritty dust from entering along with him.'

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

describe('frequency analysis', () => {
  it('counts and normalizes letters', () => {
    const counts = letterCounts('Aa Bb! cC')
    expect(counts[0]).toBe(2)
    expect(counts[1]).toBe(2)
    expect(counts[2]).toBe(2)
    expect(letterFrequencies('AABB')[0]).toBe(50)
  })
  it('cracks a Caesar shift via chi-squared', () => {
    for (const shift of [3, 7, 13, 21]) {
      const cipher = caesar(ENGLISH_SAMPLE, shift, 'encrypt')
      expect(rankShifts(cipher)[0].shift).toBe(shift)
    }
  })
  it('index of coincidence distinguishes English from flat text', () => {
    expect(indexOfCoincidence(ENGLISH_SAMPLE)).toBeGreaterThan(0.055)
    expect(indexOfCoincidence('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBeLessThan(0.01)
  })
  it('estimates the Vigenère key length', () => {
    const cipher = vigenere(ENGLISH_SAMPLE, 'LEMON', 'encrypt')
    const best = estimateKeyLengths(cipher)[0]
    expect(best.length % 5).toBe(0) // true length or a multiple
  })
  it('recovers the full Vigenère key and plaintext', () => {
    const cipher = vigenere(ENGLISH_SAMPLE, 'LEMON', 'encrypt')
    const crack = crackVigenere(cipher)
    expect(crack.key).toBe('LEMON')
    expect(crack.plaintext).toBe(ENGLISH_SAMPLE)
  })
  it('refuses hopelessly short ciphertext', () => {
    expect(() => crackVigenere('SHORT')).toThrow()
  })
})

describe('format detection', () => {
  it('detects UUIDs, JWTs, and epochs', () => {
    expect(detectFormats('f47ac10b-58cc-4372-a567-0e02b2c3d479')[0].toolId).toBe('uuid')
    expect(
      detectFormats(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
      )[0].toolId,
    ).toBe('jwt')
    expect(detectFormats('1720000000')[0].toolId).toBe('time')
    expect(detectFormats('1720000000000')[0].toolId).toBe('time')
  })
  it('detects binary, morse, hex, url-encoding and base64', () => {
    expect(detectFormats('01001000 01101001')[0].toolId).toBe('binary')
    expect(detectFormats('.... . .-.. .-.. ---')[0].toolId).toBe('morse')
    expect(detectFormats('48 65 6c 6c 6f')[0].toolId).toBe('hex')
    expect(detectFormats('Hello%20world%21')[0].toolId).toBe('url')
    expect(detectFormats('SGVsbG8sIHdvcmxkIQ==').map((s) => s.toolId)).toContain('base64')
  })
  it('stays quiet on plain prose', () => {
    expect(detectFormats('just a normal sentence')).toEqual([])
    expect(detectFormats('hi')).toEqual([])
  })
})

describe('kdf', () => {
  it('PBKDF2-SHA256 matches the published test vector', async () => {
    const key = await derivePbkdf2('password', 'salt', 1, 32)
    expect(toHex(key)).toBe('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b')
    const key2 = await derivePbkdf2('password', 'salt', 2, 32)
    expect(toHex(key2)).toBe('ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43')
  })
  it('scrypt is deterministic and parameter-sensitive', async () => {
    const a = await deriveScrypt('password', 'NaCl', 1024, 8, 1, 32)
    const b = await deriveScrypt('password', 'NaCl', 1024, 8, 1, 32)
    const c = await deriveScrypt('password', 'NaCl', 2048, 8, 1, 32)
    expect(toHex(a)).toBe(toHex(b))
    expect(toHex(a)).not.toBe(toHex(c))
    expect(a.length).toBe(32)
  })
  it('scrypt matches the RFC 7914 vector (N=1024, r=8, p=16)', async () => {
    const key = await deriveScrypt('password', 'NaCl', 1024, 8, 16, 64)
    expect(toHex(key).startsWith('fdbabe1c9d3472007856e7190d01e9fe')).toBe(true)
  })
  it('rejects non-power-of-two N', async () => {
    await expect(deriveScrypt('x', 'y', 1000)).rejects.toThrow()
  })
  it('timeDerivation reports duration', async () => {
    const { key, ms } = await timeDerivation(() => derivePbkdf2('pw', 's', 1000))
    expect(key.length).toBe(32)
    expect(ms).toBeGreaterThanOrEqual(0)
  })
})

describe('flipBit', () => {
  it('flips exactly the requested bit', () => {
    const out = flipBit(new Uint8Array([0b00000000, 0b11111111]), 1, 3)
    expect([...out]).toEqual([0b00000000, 0b11110111])
  })
  it('handles empty input and clamps out-of-range byte index', () => {
    expect([...flipBit(new Uint8Array(0), 5, 0)]).toEqual([1])
    expect([...flipBit(new Uint8Array([0]), 99, 0)]).toEqual([1])
  })
})
