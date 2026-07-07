import { vigenere } from '@/lib/ciphers/vigenere'

/** Relative letter frequencies of English text, in percent (A–Z). */
export const ENGLISH_FREQ = [
  8.167, 1.492, 2.782, 4.253, 12.702, 2.228, 2.015, 6.094, 6.966, 0.153, 0.772, 4.025, 2.406,
  6.749, 7.507, 1.929, 0.095, 5.987, 6.327, 9.056, 2.758, 0.978, 2.36, 0.15, 1.974, 0.074,
]

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** Count occurrences of each letter A–Z (case-insensitive), ignoring everything else. */
export function letterCounts(text: string): number[] {
  const counts = new Array<number>(26).fill(0)
  for (const ch of text.toUpperCase()) {
    const idx = ch.charCodeAt(0) - 65
    if (idx >= 0 && idx < 26) counts[idx]++
  }
  return counts
}

/** Letter frequencies in percent; all zeros when the text has no letters. */
export function letterFrequencies(text: string): number[] {
  const counts = letterCounts(text)
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return counts
  return counts.map((c) => (c / total) * 100)
}

/**
 * Chi-squared distance between the text decrypted with `shift` and English.
 * Lower is more English-like.
 */
export function chiSquaredForShift(counts: number[], shift: number): number {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return Infinity
  let chi2 = 0
  for (let i = 0; i < 26; i++) {
    // Plain letter i encrypts to (i + shift) % 26, so decrypting maps it back.
    const observed = counts[(i + shift) % 26]
    const expected = (total * ENGLISH_FREQ[i]) / 100
    chi2 += ((observed - expected) ** 2) / expected
  }
  return chi2
}

export type ShiftScore = { shift: number; score: number }

/** All 26 candidate Caesar shifts ranked best (most English-like) first. */
export function rankShifts(text: string): ShiftScore[] {
  const counts = letterCounts(text)
  if (counts.reduce((a, b) => a + b, 0) === 0) return []
  const scores: ShiftScore[] = []
  for (let shift = 0; shift < 26; shift++) {
    scores.push({ shift, score: chiSquaredForShift(counts, shift) })
  }
  return scores.sort((a, b) => a.score - b.score)
}

/** Index of coincidence — ~0.066 for English, ~0.038 for random letters. */
export function indexOfCoincidence(text: string): number {
  const counts = letterCounts(text)
  const n = counts.reduce((a, b) => a + b, 0)
  if (n < 2) return 0
  let sum = 0
  for (const c of counts) sum += c * (c - 1)
  return sum / (n * (n - 1))
}

export type KeyLengthGuess = { length: number; ic: number }

/**
 * Rank candidate Vigenère key lengths by the average index of coincidence of
 * the columns each length produces. The true length (and its multiples) score
 * near English's 0.066.
 */
export function estimateKeyLengths(text: string, maxLen = 12): KeyLengthGuess[] {
  const letters = text.toUpperCase().replace(/[^A-Z]/g, '')
  const guesses: KeyLengthGuess[] = []
  for (let len = 1; len <= Math.min(maxLen, Math.floor(letters.length / 2)); len++) {
    let icSum = 0
    for (let col = 0; col < len; col++) {
      let column = ''
      for (let i = col; i < letters.length; i += len) column += letters[i]
      icSum += indexOfCoincidence(column)
    }
    guesses.push({ length: len, ic: icSum / len })
  }
  return guesses.sort((a, b) => b.ic - a.ic)
}

export type VigenereCrack = {
  key: string
  keyLength: number
  plaintext: string
  keyLengthCandidates: KeyLengthGuess[]
}

/**
 * Recover a Vigenère key by estimating the key length (index of coincidence),
 * then solving each column as an independent Caesar cipher (chi-squared).
 */
export function crackVigenere(ciphertext: string, keyLength?: number): VigenereCrack {
  const letters = ciphertext.toUpperCase().replace(/[^A-Z]/g, '')
  if (letters.length < 20) {
    throw new Error('Need at least 20 letters of ciphertext for a meaningful analysis.')
  }
  const candidates = estimateKeyLengths(ciphertext)
  let len = keyLength
  if (len === undefined) {
    // Multiples of the true length score equally well — prefer the shortest
    // candidate within a whisker of the best score.
    const best = candidates[0]
    len = Math.min(
      ...candidates.filter((c) => c.ic >= best.ic - 0.004).map((c) => c.length),
    )
  }
  let key = ''
  for (let col = 0; col < len; col++) {
    let column = ''
    for (let i = col; i < letters.length; i += len) column += letters[i]
    const ranked = rankShifts(column)
    key += LETTERS[ranked[0].shift]
  }
  return {
    key,
    keyLength: len,
    plaintext: vigenere(ciphertext, key, 'decrypt'),
    keyLengthCandidates: candidates,
  }
}
