import { gcd, isPrime, modInverse, modPow } from '@/lib/math'

/** Primes small enough that n = p·q stays human-readable but > 65535 pairs exist too. */
export const TOY_PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71]

export type ToyRsaKey = {
  p: number
  q: number
  n: number
  phi: number
  e: number
  d: number
}

const PREFERRED_E = [17, 7, 5, 3, 11, 13, 19, 23, 29, 31, 37]

/** Build a full toy RSA key from two small primes, showing every intermediate value. */
export function makeToyKey(p: number, q: number, e?: number): ToyRsaKey {
  if (!isPrime(p) || !isPrime(q)) throw new Error('p and q must both be prime.')
  if (p === q) throw new Error('p and q must be different primes.')
  const n = p * q
  const phi = (p - 1) * (q - 1)
  let chosenE = e
  if (chosenE === undefined) {
    chosenE = PREFERRED_E.find((c) => c < phi && gcd(BigInt(c), BigInt(phi)) === 1n)
    if (chosenE === undefined) throw new Error('No valid public exponent found.')
  } else if (chosenE <= 1 || chosenE >= phi || gcd(BigInt(chosenE), BigInt(phi)) !== 1n) {
    throw new Error(`e must be coprime with φ(n)=${phi} and between 2 and φ(n)−1.`)
  }
  const d = Number(modInverse(BigInt(chosenE), BigInt(phi)))
  return { p, q, n, phi, e: chosenE, d }
}

/** All exponents valid for this φ(n), for a picker UI. */
export function validPublicExponents(phi: number, limit = 12): number[] {
  const out: number[] = []
  for (let e = 3; e < phi && out.length < limit; e += 2) {
    if (gcd(BigInt(e), BigInt(phi)) === 1n) out.push(e)
  }
  return out
}

export function toyEncrypt(m: number, key: ToyRsaKey): number {
  if (m < 0 || m >= key.n) throw new Error(`Message value ${m} must be < n = ${key.n}.`)
  return Number(modPow(BigInt(m), BigInt(key.e), BigInt(key.n)))
}

export function toyDecrypt(c: number, key: ToyRsaKey): number {
  return Number(modPow(BigInt(c), BigInt(key.d), BigInt(key.n)))
}

export type ToyRsaStep = {
  char: string
  /** Code point — the numeric "message". */
  m: number
  /** Ciphertext number: m^e mod n. */
  c: number
  /** Round-trip check: c^d mod n. */
  back: number
}

/** Encrypt a short string character-by-character, keeping every step for display. */
export function toyEncryptText(text: string, key: ToyRsaKey): ToyRsaStep[] {
  const steps: ToyRsaStep[] = []
  for (const char of text) {
    const m = char.codePointAt(0)!
    if (m >= key.n) {
      throw new Error(
        `'${char}' has code ${m}, which is ≥ n = ${key.n}. Pick larger primes so every character fits.`,
      )
    }
    const c = toyEncrypt(m, key)
    steps.push({ char, m, c, back: toyDecrypt(c, key) })
  }
  return steps
}
