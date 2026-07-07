export type UuidFieldRole = 'time' | 'version' | 'variant' | 'clock' | 'node' | 'random'

export type UuidField = {
  /** Hex characters of this field (no dashes). */
  hex: string
  role: UuidFieldRole
  label: string
}

export type UuidInfo = {
  canonical: string
  version: number
  variant: string
  /** Embedded timestamp — only v1, v6 and v7 carry one. */
  timestamp?: Date
  fields: UuidField[]
}

/** 100-ns intervals between the Gregorian epoch (1582-10-15) and the Unix epoch. */
const GREGORIAN_TO_UNIX_100NS = 122192928000000000n

function variantName(nibble: number): string {
  if (nibble <= 0x7) return 'NCS (legacy)'
  if (nibble <= 0xb) return 'RFC 4122 / 9562'
  if (nibble <= 0xd) return 'Microsoft (legacy)'
  return 'Reserved (future)'
}

function fieldsFor(hex: string, version: number): UuidField[] {
  const f = (start: number, end: number, role: UuidFieldRole, label: string): UuidField => ({
    hex: hex.slice(start, end),
    role,
    label,
  })
  switch (version) {
    case 1:
      return [
        f(0, 8, 'time', 'time_low'),
        f(8, 12, 'time', 'time_mid'),
        f(12, 13, 'version', 'version'),
        f(13, 16, 'time', 'time_high'),
        f(16, 17, 'variant', 'variant'),
        f(17, 20, 'clock', 'clock_seq'),
        f(20, 32, 'node', 'node (MAC)'),
      ]
    case 6:
      return [
        f(0, 8, 'time', 'time_high'),
        f(8, 12, 'time', 'time_mid'),
        f(12, 13, 'version', 'version'),
        f(13, 16, 'time', 'time_low'),
        f(16, 17, 'variant', 'variant'),
        f(17, 20, 'clock', 'clock_seq'),
        f(20, 32, 'node', 'node'),
      ]
    case 7:
      return [
        f(0, 12, 'time', 'unix_ts_ms'),
        f(12, 13, 'version', 'version'),
        f(13, 16, 'random', 'rand_a'),
        f(16, 17, 'variant', 'variant'),
        f(17, 32, 'random', 'rand_b'),
      ]
    default:
      return [
        f(0, 12, 'random', 'random'),
        f(12, 13, 'version', 'version'),
        f(13, 16, 'random', 'random'),
        f(16, 17, 'variant', 'variant'),
        f(17, 32, 'random', 'random'),
      ]
  }
}

function timestampFor(hex: string, version: number): Date | undefined {
  if (version === 1) {
    const timeLow = BigInt('0x' + hex.slice(0, 8))
    const timeMid = BigInt('0x' + hex.slice(8, 12))
    const timeHigh = BigInt('0x' + hex.slice(13, 16))
    const ts100ns = (timeHigh << 48n) | (timeMid << 32n) | timeLow
    return new Date(Number((ts100ns - GREGORIAN_TO_UNIX_100NS) / 10000n))
  }
  if (version === 6) {
    const high = BigInt('0x' + hex.slice(0, 8))
    const mid = BigInt('0x' + hex.slice(8, 12))
    const low = BigInt('0x' + hex.slice(13, 16))
    const ts100ns = (high << 28n) | (mid << 12n) | low
    return new Date(Number((ts100ns - GREGORIAN_TO_UNIX_100NS) / 10000n))
  }
  if (version === 7) {
    return new Date(Number(BigInt('0x' + hex.slice(0, 12))))
  }
  return undefined
}

export function parseUuid(input: string): UuidInfo {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^urn:uuid:/, '')
    .replace(/[{}]/g, '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(cleaned)) {
    throw new Error('Not a valid UUID — expected 8-4-4-4-12 hex groups.')
  }
  const hex = cleaned.replace(/-/g, '')
  const version = parseInt(hex[12], 16)
  const variant = variantName(parseInt(hex[16], 16))
  return {
    canonical: cleaned,
    version,
    variant,
    timestamp: timestampFor(hex, version),
    fields: fieldsFor(hex, version),
  }
}

function toCanonical(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function uuidV4(): string {
  return crypto.randomUUID()
}

export function uuidV7(now: Date = new Date()): string {
  const ms = BigInt(now.getTime())
  const tsHex = ms.toString(16).padStart(12, '0')
  const rand = new Uint8Array(10)
  crypto.getRandomValues(rand)
  let randHex = ''
  for (const b of rand) randHex += b.toString(16).padStart(2, '0')
  const randA = randHex.slice(0, 3)
  const variantNibble = (8 + (parseInt(randHex[3], 16) & 3)).toString(16)
  const randB = randHex.slice(4, 19)
  return toCanonical(`${tsHex}7${randA}${variantNibble}${randB}`)
}
