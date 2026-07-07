export type EpochUnit = 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds'

export const EPOCH_UNITS: EpochUnit[] = ['seconds', 'milliseconds', 'microseconds', 'nanoseconds']

export const epochUnitLabels: Record<EpochUnit, string> = {
  seconds: 'Epoch seconds',
  milliseconds: 'Epoch milliseconds',
  microseconds: 'Epoch microseconds',
  nanoseconds: 'Epoch nanoseconds',
}

const MS_PER_UNIT: Record<EpochUnit, number> = {
  seconds: 1000,
  milliseconds: 1,
  microseconds: 1 / 1000,
  nanoseconds: 1 / 1_000_000,
}

/** Max |milliseconds| a JS Date can represent (±275,760-09-13). */
const MAX_DATE_MS = 8.64e15

/**
 * Guess the unit of a numeric timestamp from its digit count.
 * Around "now" (2026): seconds ≈ 10 digits, ms ≈ 13, µs ≈ 16, ns ≈ 19.
 */
export function detectEpochUnit(value: string): EpochUnit {
  const digits = value.replace(/^-/, '').split('.')[0].replace(/^0+(?=\d)/, '').length
  if (digits <= 11) return 'seconds'
  if (digits <= 14) return 'milliseconds'
  if (digits <= 17) return 'microseconds'
  return 'nanoseconds'
}

export function epochToDate(value: number, unit: EpochUnit): Date {
  const ms = value * MS_PER_UNIT[unit]
  if (!Number.isFinite(ms) || Math.abs(ms) > MAX_DATE_MS) {
    throw new Error(`Timestamp is out of range for a date when read as ${unit}.`)
  }
  return new Date(Math.round(ms))
}

export type ParsedTime = {
  date: Date
  /** How the input was interpreted, e.g. "Epoch seconds". */
  interpretation: string
  /** Set when the input was a bare number. */
  unit?: EpochUnit
}

const NUMERIC_RE = /^-?\d+(\.\d+)?$/

/**
 * Parse a timestamp or date string. Bare numbers are treated as epoch
 * timestamps (unit auto-detected unless overridden); anything else goes
 * through the platform date parser (ISO 8601, RFC 2822, etc.).
 */
export function parseTimeInput(raw: string, unitOverride: EpochUnit | 'auto' = 'auto'): ParsedTime {
  const input = raw.trim()
  if (input === '') throw new Error('Enter a timestamp or a date.')

  if (NUMERIC_RE.test(input)) {
    const unit = unitOverride === 'auto' ? detectEpochUnit(input) : unitOverride
    const date = epochToDate(Number(input), unit)
    return { date, unit, interpretation: epochUnitLabels[unit] }
  }

  if (/^now$/i.test(input)) {
    return { date: new Date(), interpretation: 'Current time' }
  }

  // Normalize "YYYY-MM-DD HH:mm" to ISO's "T" separator for consistency.
  const normalized = /^\d{4}-\d{2}-\d{2} /.test(input) ? input.replace(' ', 'T') : input
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      'Unrecognized format. Try an epoch timestamp (e.g. 1720000000) or a date like 2026-07-08T12:00:00Z.',
    )
  }
  return { date, interpretation: 'Date string' }
}

function pad(n: number, width = 2): string {
  return String(Math.abs(n)).padStart(width, '0')
}

/** ISO 8601 in the machine's local zone, with UTC offset, e.g. 2026-07-08T17:30:00+05:30 */
export function isoLocal(date: Date): string {
  const offsetMin = -date.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  )
}

/** Human-readable relative time, e.g. "3 hours ago" / "in 2 days". */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const diffSec = (date.getTime() - now.getTime()) / 1000
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (abs < 60) return rtf.format(Math.round(diffSec), 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day')
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30.44)), 'month')
  return rtf.format(Math.round(diffSec / (86400 * 365.25)), 'year')
}

/** 1-based day of the year, in UTC. */
export function dayOfYearUTC(date: Date): number {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1)
  return Math.floor((date.getTime() - startOfYear) / 86_400_000) + 1
}

/** ISO 8601 week number (weeks start Monday; week 1 contains the first Thursday), in UTC. */
export function isoWeekUTC(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  // Shift to the Thursday of this week — it determines the ISO year.
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

export type EpochBreakdown = {
  totalSeconds: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Decompose an instant into whole days + h/m/s since the Unix epoch. */
export function epochBreakdown(date: Date): EpochBreakdown {
  const totalSeconds = Math.floor(date.getTime() / 1000)
  const days = Math.floor(totalSeconds / 86400)
  let rem = totalSeconds - days * 86400
  const hours = Math.floor(rem / 3600)
  rem -= hours * 3600
  const minutes = Math.floor(rem / 60)
  return { totalSeconds, days, hours, minutes, seconds: rem - minutes * 60 }
}

export function formatInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(date)
}

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export type TimeFormatRow = {
  key: string
  label: string
  value: string
  hint?: string
}

/** Every output format the tool displays, derived from one instant. */
export function formatAll(date: Date, now: Date = new Date()): TimeFormatRow[] {
  const ms = date.getTime()
  const { week, year } = isoWeekUTC(date)
  return [
    {
      key: 'unix-s',
      label: 'Epoch seconds',
      value: String(Math.floor(ms / 1000)),
      hint: 'Unix time — seconds since 1970-01-01 00:00:00 UTC',
    },
    {
      key: 'unix-ms',
      label: 'Epoch milliseconds',
      value: String(ms),
      hint: 'What JavaScript Date.now() returns',
    },
    {
      key: 'iso-utc',
      label: 'ISO 8601 (UTC)',
      value: date.toISOString(),
      hint: 'The standard machine-readable format',
    },
    {
      key: 'iso-local',
      label: 'ISO 8601 (local)',
      value: isoLocal(date),
      hint: 'Same instant, expressed with your UTC offset',
    },
    {
      key: 'http',
      label: 'HTTP / RFC 7231',
      value: date.toUTCString(),
      hint: 'Used in HTTP headers like Date and Expires',
    },
    {
      key: 'local',
      label: 'Local time',
      value: new Intl.DateTimeFormat(undefined, {
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(date),
      hint: `Your zone: ${localTimeZone()}`,
    },
    {
      key: 'relative',
      label: 'Relative',
      value: relativeTime(date, now),
    },
    {
      key: 'extras',
      label: 'Calendar',
      value: `Day ${dayOfYearUTC(date)} of the year · ISO week ${week} of ${year} (UTC)`,
    },
  ]
}
