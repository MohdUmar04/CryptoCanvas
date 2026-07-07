import { describe, expect, it } from 'vitest'
import {
  dayOfYearUTC,
  detectEpochUnit,
  epochBreakdown,
  epochToDate,
  isoWeekUTC,
  parseTimeInput,
  relativeTime,
} from '@/lib/time'

describe('detectEpochUnit', () => {
  it('detects unit by digit count', () => {
    expect(detectEpochUnit('1720000000')).toBe('seconds')
    expect(detectEpochUnit('1720000000000')).toBe('milliseconds')
    expect(detectEpochUnit('1720000000000000')).toBe('microseconds')
    expect(detectEpochUnit('1720000000000000000')).toBe('nanoseconds')
  })
  it('ignores sign and fraction', () => {
    expect(detectEpochUnit('-1720000000')).toBe('seconds')
    expect(detectEpochUnit('1720000000.5')).toBe('seconds')
  })
})

describe('epochToDate', () => {
  it('all units map to the same instant', () => {
    const iso = '2024-07-03T09:46:40.000Z'
    expect(epochToDate(1720000000, 'seconds').toISOString()).toBe(iso)
    expect(epochToDate(1720000000000, 'milliseconds').toISOString()).toBe(iso)
    expect(epochToDate(1720000000000000, 'microseconds').toISOString()).toBe(iso)
    expect(epochToDate(1720000000000000000, 'nanoseconds').toISOString()).toBe(iso)
  })
  it('supports pre-1970 (negative) timestamps', () => {
    expect(epochToDate(-86400, 'seconds').toISOString()).toBe('1969-12-31T00:00:00.000Z')
  })
  it('rejects out-of-range values', () => {
    expect(() => epochToDate(9e15, 'milliseconds')).toThrow()
  })
})

describe('parseTimeInput', () => {
  it('parses bare numbers as epoch with auto-detect', () => {
    const p = parseTimeInput('1720000000')
    expect(p.unit).toBe('seconds')
    expect(p.date.toISOString()).toBe('2024-07-03T09:46:40.000Z')
  })
  it('respects the unit override', () => {
    const p = parseTimeInput('1720000000', 'milliseconds')
    expect(p.date.toISOString()).toBe('1970-01-20T21:46:40.000Z')
  })
  it('parses ISO 8601 strings', () => {
    expect(parseTimeInput('2024-07-03T09:46:40Z').date.getTime()).toBe(1720000000000)
  })
  it('accepts a space instead of the T separator', () => {
    expect(parseTimeInput('2024-07-03 09:46:40Z').date.getTime()).toBe(1720000000000)
  })
  it('throws on empty and garbage input', () => {
    expect(() => parseTimeInput('')).toThrow()
    expect(() => parseTimeInput('not a date')).toThrow()
  })
})

describe('calendar helpers', () => {
  it('computes day of year in UTC', () => {
    expect(dayOfYearUTC(new Date('2024-01-01T00:00:00Z'))).toBe(1)
    expect(dayOfYearUTC(new Date('2024-07-03T09:46:40Z'))).toBe(185)
    expect(dayOfYearUTC(new Date('2024-12-31T23:59:59Z'))).toBe(366) // leap year
  })
  it('computes ISO week numbers', () => {
    expect(isoWeekUTC(new Date('2024-01-01T00:00:00Z'))).toEqual({ week: 1, year: 2024 })
    // Jan 1 2021 was a Friday — it belongs to week 53 of ISO year 2020.
    expect(isoWeekUTC(new Date('2021-01-01T00:00:00Z'))).toEqual({ week: 53, year: 2020 })
  })
})

describe('epochBreakdown', () => {
  it('decomposes into days + h/m/s', () => {
    const b = epochBreakdown(new Date(1720000000000))
    expect(b).toEqual({
      totalSeconds: 1720000000,
      days: 19907,
      hours: 9,
      minutes: 46,
      seconds: 40,
    })
    expect(b.days * 86400 + b.hours * 3600 + b.minutes * 60 + b.seconds).toBe(b.totalSeconds)
  })
})

describe('relativeTime', () => {
  const now = new Date('2026-07-08T12:00:00Z')
  it('describes past and future instants', () => {
    expect(relativeTime(new Date('2026-07-08T11:00:00Z'), now)).toMatch(/hour/)
    expect(relativeTime(new Date('2026-07-10T12:00:00Z'), now)).toMatch(/day/)
    expect(relativeTime(new Date('2027-08-08T12:00:00Z'), now)).toMatch(/year/)
  })
})
