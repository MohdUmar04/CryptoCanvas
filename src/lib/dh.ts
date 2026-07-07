import { modPow } from '@/lib/math'

/** Small safe-ish primes with a generator — sized for humans, not security. */
export const DH_GROUPS: { p: number; g: number }[] = [
  { p: 23, g: 5 },
  { p: 47, g: 5 },
  { p: 97, g: 5 },
  { p: 227, g: 2 },
  { p: 467, g: 2 },
  { p: 997, g: 7 },
]

export type DhExchange = {
  p: number
  g: number
  /** Alice's and Bob's private exponents. */
  a: number
  b: number
  /** Public values exchanged over the wire: A = g^a mod p, B = g^b mod p. */
  A: number
  B: number
  /** What each side computes locally: B^a mod p and A^b mod p. */
  secretAlice: number
  secretBob: number
}

export function dhExchange(p: number, g: number, a: number, b: number): DhExchange {
  if (a < 1 || b < 1 || a > p - 2 || b > p - 2) {
    throw new Error(`Private keys must be between 1 and p−2 (${p - 2}).`)
  }
  const P = BigInt(p)
  const G = BigInt(g)
  const A = Number(modPow(G, BigInt(a), P))
  const B = Number(modPow(G, BigInt(b), P))
  return {
    p,
    g,
    a,
    b,
    A,
    B,
    secretAlice: Number(modPow(BigInt(B), BigInt(a), P)),
    secretBob: Number(modPow(BigInt(A), BigInt(b), P)),
  }
}

/** A random private exponent in [2, p−2] for demo purposes. */
export function randomSecret(p: number): number {
  const range = p - 3
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return 2 + (buf[0] % range)
}
