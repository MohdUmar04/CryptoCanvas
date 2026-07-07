import { describe, expect, it } from 'vitest'
import { gcd, isPrime, modInverse, modPow } from '@/lib/math'
import { dhExchange, DH_GROUPS, randomSecret } from '@/lib/dh'
import {
  makeToyKey,
  toyDecrypt,
  toyEncrypt,
  toyEncryptText,
  validPublicExponents,
} from '@/lib/rsa-toy'

describe('math', () => {
  it('modPow matches known values', () => {
    expect(modPow(5n, 6n, 23n)).toBe(8n)
    expect(modPow(2n, 10n, 1000n)).toBe(24n)
    expect(modPow(65n, 17n, 3233n)).toBe(2790n)
  })
  it('gcd and modInverse', () => {
    expect(gcd(12n, 18n)).toBe(6n)
    expect(modInverse(17n, 3120n)).toBe(2753n)
    expect((17n * modInverse(17n, 3120n)) % 3120n).toBe(1n)
    expect(() => modInverse(6n, 12n)).toThrow()
  })
  it('isPrime', () => {
    expect(isPrime(2)).toBe(true)
    expect(isPrime(61)).toBe(true)
    expect(isPrime(1)).toBe(false)
    expect(isPrime(91)).toBe(false) // 7 × 13
  })
})

describe('diffie-hellman', () => {
  it('classic textbook exchange (p=23, g=5, a=6, b=15)', () => {
    const ex = dhExchange(23, 5, 6, 15)
    expect(ex.A).toBe(8)
    expect(ex.B).toBe(19)
    expect(ex.secretAlice).toBe(2)
    expect(ex.secretBob).toBe(2)
  })
  it('both sides always agree, for every preset group', () => {
    for (const { p, g } of DH_GROUPS) {
      const a = randomSecret(p)
      const b = randomSecret(p)
      const ex = dhExchange(p, g, a, b)
      expect(ex.secretAlice).toBe(ex.secretBob)
    }
  })
  it('rejects out-of-range secrets', () => {
    expect(() => dhExchange(23, 5, 0, 5)).toThrow()
    expect(() => dhExchange(23, 5, 5, 22)).toThrow()
  })
})

describe('toy RSA', () => {
  it('builds the textbook key (p=61, q=53, e=17)', () => {
    const key = makeToyKey(61, 53, 17)
    expect(key.n).toBe(3233)
    expect(key.phi).toBe(3120)
    expect(key.d).toBe(2753)
  })
  it('encrypts and decrypts the textbook message', () => {
    const key = makeToyKey(61, 53, 17)
    expect(toyEncrypt(65, key)).toBe(2790)
    expect(toyDecrypt(2790, key)).toBe(65)
  })
  it('round-trips text character by character', () => {
    const key = makeToyKey(61, 53)
    const steps = toyEncryptText('Hi!', key)
    expect(steps.map((s) => s.back)).toEqual(steps.map((s) => s.m))
    expect(String.fromCodePoint(...steps.map((s) => s.back))).toBe('Hi!')
  })
  it('rejects characters that do not fit below n', () => {
    const key = makeToyKey(11, 13) // n = 143
    expect(() => toyEncryptText('é', key)).toThrow() // é = 233 ≥ 143
  })
  it('rejects bad parameters', () => {
    expect(() => makeToyKey(10, 13)).toThrow() // 10 not prime
    expect(() => makeToyKey(13, 13)).toThrow() // equal primes
    expect(() => makeToyKey(61, 53, 4)).toThrow() // gcd(4, 3120) ≠ 1
  })
  it('lists valid public exponents', () => {
    const es = validPublicExponents(3120, 5)
    expect(es).toContain(17)
    expect(es.every((e) => e % 2 === 1)).toBe(true)
  })
})
