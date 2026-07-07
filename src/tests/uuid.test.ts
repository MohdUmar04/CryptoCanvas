import { describe, expect, it } from 'vitest'
import { parseUuid, uuidV4, uuidV7 } from '@/lib/uuid'

describe('parseUuid', () => {
  it('parses a v4 UUID', () => {
    const info = parseUuid('F47AC10B-58CC-4372-A567-0E02B2C3D479')
    expect(info.version).toBe(4)
    expect(info.variant).toBe('RFC 4122 / 9562')
    expect(info.canonical).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
    expect(info.timestamp).toBeUndefined()
  })
  it('accepts urn: and braced forms', () => {
    expect(parseUuid('urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479').version).toBe(4)
    expect(parseUuid('{f47ac10b-58cc-4372-a567-0e02b2c3d479}').version).toBe(4)
  })
  it('extracts the v1 timestamp', () => {
    // Well-known example UUID from RFC 4122 errata discussions:
    // c232ab00-9414-11ec-b3c8-9e6bdeced846 → 2022-02-22T19:22:22Z (v1)
    const info = parseUuid('c232ab00-9414-11ec-b3c8-9e6bdeced846')
    expect(info.version).toBe(1)
    expect(info.timestamp?.toISOString()).toBe('2022-02-22T19:22:22.000Z')
  })
  it('extracts the v7 timestamp', () => {
    // RFC 9562 appendix example: 017F22E2-79B0-7CC3-98C4-DC0C0C07398F → 2022-02-22T19:22:22Z
    const info = parseUuid('017F22E2-79B0-7CC3-98C4-DC0C0C07398F')
    expect(info.version).toBe(7)
    expect(info.timestamp?.toISOString()).toBe('2022-02-22T19:22:22.000Z')
  })
  it('labels the field layout', () => {
    const info = parseUuid('017F22E2-79B0-7CC3-98C4-DC0C0C07398F')
    expect(info.fields.map((f) => f.hex).join('')).toBe('017f22e279b07cc398c4dc0c0c07398f')
    expect(info.fields[0].role).toBe('time')
  })
  it('rejects malformed input', () => {
    expect(() => parseUuid('not-a-uuid')).toThrow()
    expect(() => parseUuid('f47ac10b58cc4372a5670e02b2c3d479')).toThrow() // missing dashes
  })
})

describe('generators', () => {
  it('v4 output parses as version 4', () => {
    expect(parseUuid(uuidV4()).version).toBe(4)
  })
  it('v7 output parses as version 7 with the right timestamp', () => {
    const at = new Date('2026-07-08T12:00:00.000Z')
    const id = uuidV7(at)
    const info = parseUuid(id)
    expect(info.version).toBe(7)
    expect(info.variant).toBe('RFC 4122 / 9562')
    expect(info.timestamp?.getTime()).toBe(at.getTime())
  })
  it('v7 ids are unique and lexicographically time-ordered', () => {
    const early = uuidV7(new Date(1000000000000))
    const late = uuidV7(new Date(2000000000000))
    expect(early < late).toBe(true)
    expect(uuidV7()).not.toBe(uuidV7())
  })
})
