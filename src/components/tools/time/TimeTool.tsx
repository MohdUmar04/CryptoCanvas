import { Clock3, LocateFixed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getToolById } from '@/data/tools'
import { useQueryState } from '@/hooks/useQueryState'
import {
  EPOCH_UNITS,
  epochBreakdown,
  epochUnitLabels,
  formatAll,
  formatInZone,
  localTimeZone,
  parseTimeInput,
  type EpochUnit,
} from '@/lib/time'
import { cn } from '@/lib/utils'

const WORLD_ZONES: { zone: string; label: string }[] = [
  { zone: 'UTC', label: 'UTC' },
  { zone: 'America/Los_Angeles', label: 'Los Angeles' },
  { zone: 'America/New_York', label: 'New York' },
  { zone: 'Europe/London', label: 'London' },
  { zone: 'Europe/Berlin', label: 'Berlin' },
  { zone: 'Asia/Kolkata', label: 'Kolkata' },
  { zone: 'Asia/Tokyo', label: 'Tokyo' },
  { zone: 'Australia/Sydney', label: 'Sydney' },
]

function groupDigits(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function TimeTool() {
  const tool = getToolById('time')!
  const [input, setInput] = useQueryState('in')
  const [unit, setUnit] = useState<EpochUnit | 'auto'>('auto')
  const [now, setNow] = useState(() => new Date())

  // Tick every second: drives the live clock and keeps "relative" fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const isLive = input.trim() === ''
  const parsed = useMemo(() => {
    if (isLive) return { ok: true as const, date: now, interpretation: 'Live current time' }
    try {
      const p = parseTimeInput(input, unit)
      return { ok: true as const, date: p.date, interpretation: p.interpretation }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) }
    }
  }, [input, unit, isLive, now])

  const rows = parsed.ok ? formatAll(parsed.date, now) : []
  const breakdown = parsed.ok ? epochBreakdown(parsed.date) : null
  const myZone = localTimeZone()

  return (
    <ToolShell
      tool={tool}
      shareable
      headerExtras={
        <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs tabular-nums text-muted-foreground">
          <Clock3 className="size-3.5 text-primary" />
          now: {Math.floor(now.getTime() / 1000)}
        </span>
      }
      explanation={
        <>
          <p>
            <strong>Unix (epoch) time</strong> is a single number: the count of seconds since{' '}
            <code>1970-01-01 00:00:00 UTC</code> — "the epoch". It has no time zone, no daylight
            saving, no calendar — which is exactly why computers use it to store and compare
            moments in time. Every human-readable date is just that number rendered through a time
            zone.
          </p>
          <p>
            Precision varies by system: seconds (10 digits today), milliseconds (13 — JavaScript's{' '}
            <code>Date.now()</code>), microseconds (16) and nanoseconds (19). This tool
            auto-detects the unit from the digit count.
          </p>
          <p>
            Fun fact: systems storing seconds in a signed 32-bit integer overflow on{' '}
            <code>2038-01-19 03:14:07 UTC</code> (the "Year 2038 problem") — the epoch equivalent
            of Y2K.
          </p>
        </>
      }
    >
      <ToolPane
        title="Input"
        description="Paste an epoch timestamp or any date string — or leave empty to track the current time."
        contentClassName="flex flex-wrap items-end gap-x-4 gap-y-3"
      >
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <Label htmlFor="time-input">Timestamp or date</Label>
          <Input
            id="time-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1720000000 · 2026-07-08T12:00:00Z · Jul 8 2026…"
            className="font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="time-unit">Epoch unit</Label>
          <Select value={unit} onValueChange={(v) => setUnit(v as EpochUnit | 'auto')}>
            <SelectTrigger id="time-unit" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect</SelectItem>
              {EPOCH_UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {epochUnitLabels[u]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
        >
          <LocateFixed className="size-4" /> Now
        </Button>
        <p
          className={cn(
            'w-full text-xs',
            parsed.ok ? 'text-muted-foreground' : 'text-destructive',
          )}
          role={parsed.ok ? undefined : 'alert'}
        >
          {parsed.ok ? (
            <>
              Interpreted as: <span className="font-medium text-primary">{parsed.interpretation}</span>
            </>
          ) : (
            parsed.error
          )}
        </p>
      </ToolPane>

      {parsed.ok && (
        <>
          <ToolPane title="All formats" description="One instant, every common representation.">
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-[9rem_1fr_auto] items-center gap-2 rounded-md border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-primary">{row.label}</span>
                    {row.hint && (
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {row.hint}
                      </span>
                    )}
                  </div>
                  <code className="overflow-x-auto whitespace-nowrap text-[12px] tabular-nums text-foreground/90">
                    {row.value}
                  </code>
                  <CopyButton text={row.value} iconOnly />
                </div>
              ))}
            </div>
          </ToolPane>

          {breakdown && (
            <ToolPane
              title="How the number becomes a date"
              description="Epoch time is just arithmetic — divide by 86,400 seconds per day and count from Jan 1, 1970."
            >
              <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
                <span className="rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1.5 tabular-nums">
                  {groupDigits(breakdown.totalSeconds)} s
                </span>
                <span className="text-muted-foreground">=</span>
                <span className="rounded-md border border-info/40 bg-info/5 px-2.5 py-1.5 tabular-nums">
                  {groupDigits(breakdown.days)} days
                </span>
                <span className="text-muted-foreground">+</span>
                <span className="rounded-md border border-success/40 bg-success/5 px-2.5 py-1.5 tabular-nums">
                  {breakdown.hours} h {breakdown.minutes} m {breakdown.seconds} s
                </span>
                <span className="text-xs text-muted-foreground">
                  counted from 1970-01-01 00:00:00 UTC
                </span>
              </div>
            </ToolPane>
          )}

          <ToolPane
            title="World clock"
            description="The same instant rendered in different time zones — only the display changes, never the number."
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[{ zone: myZone, label: `${myZone} (you)` }, ...WORLD_ZONES.filter((z) => z.zone !== myZone)].map(
                ({ zone, label }) => (
                  <div key={zone} className="rounded-md border bg-background px-3 py-2">
                    <span className="block text-xs font-semibold text-primary">{label}</span>
                    <span className="block font-mono text-[12px] tabular-nums text-foreground/90">
                      {formatInZone(parsed.date, zone)}
                    </span>
                  </div>
                ),
              )}
            </div>
          </ToolPane>
        </>
      )}
    </ToolShell>
  )
}
