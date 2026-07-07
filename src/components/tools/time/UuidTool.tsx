import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getToolById } from '@/data/tools'
import { useQueryState } from '@/hooks/useQueryState'
import { formatInZone } from '@/lib/time'
import { parseUuid, uuidV4, uuidV7, type UuidFieldRole } from '@/lib/uuid'

const ROLE_STYLE: Record<UuidFieldRole, string> = {
  time: 'bg-info/15 text-info ring-info/40',
  version: 'bg-primary/15 text-primary ring-primary/40',
  variant: 'bg-warning/15 text-warning ring-warning/40',
  clock: 'bg-success/15 text-success ring-success/40',
  node: 'bg-muted text-muted-foreground ring-border',
  random: 'bg-muted text-muted-foreground ring-border',
}

const ROLE_LABEL: Record<UuidFieldRole, string> = {
  time: 'timestamp',
  version: 'version',
  variant: 'variant',
  clock: 'clock seq',
  node: 'node',
  random: 'random',
}

export function UuidTool() {
  const tool = getToolById('uuid')!
  const [value, setValue] = useQueryState('in')

  // Seed with a fresh v4 if nothing came from the URL.
  useEffect(() => {
    if (value.trim() === '') setValue(uuidV4())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parsed = useMemo(() => {
    if (value.trim() === '') return null
    try {
      return { info: parseUuid(value), error: null as string | null }
    } catch (e) {
      return { info: null, error: e instanceof Error ? e.message : String(e) }
    }
  }, [value])

  const rolesPresent = useMemo(() => {
    const seen = new Set<UuidFieldRole>()
    parsed?.info?.fields.forEach((f) => seen.add(f.role))
    return [...seen]
  }, [parsed])

  return (
    <ToolShell
      tool={tool}
      shareable
      explanation={
        <>
          <p>
            A <strong>UUID</strong> is a 128-bit identifier written as 32 hex digits in
            8-4-4-4-12 groups. Two nibbles are fixed metadata: the <em>version</em> (which
            generation scheme) and the <em>variant</em> (which layout spec). Everything else is
            version-specific.
          </p>
          <p>
            <strong>v4</strong> is 122 random bits — no meaning, just uniqueness.{' '}
            <strong>v1</strong> and <strong>v7</strong> embed a timestamp: v1 counts 100-ns ticks
            since 1582, while v7 stores plain Unix milliseconds up front, so v7 IDs sort in time
            order — great as database keys.
          </p>
        </>
      }
    >
      <ToolPane
        title="UUID"
        contentClassName="flex flex-wrap items-center gap-2"
        actions={value ? <CopyButton text={value} iconOnly /> : null}
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a UUID, or generate one below…"
          className="min-w-56 flex-1 font-mono"
          spellCheck={false}
        />
        <Button variant="outline" onClick={() => setValue(uuidV4())}>
          <RefreshCw className="size-4" /> v4
        </Button>
        <Button variant="outline" onClick={() => setValue(uuidV7())}>
          <RefreshCw className="size-4" /> v7
        </Button>
      </ToolPane>

      {parsed?.error && (
        <p className="text-sm text-destructive" role="alert">
          {parsed.error}
        </p>
      )}

      {parsed?.info && (
        <>
          <ToolPane title="Overview" contentClassName="grid gap-2 sm:grid-cols-3">
            <Fact label="Version" value={`v${parsed.info.version}`} />
            <Fact label="Variant" value={parsed.info.variant} />
            <Fact
              label="Timestamp"
              value={
                parsed.info.timestamp
                  ? formatInZone(parsed.info.timestamp, 'UTC')
                  : '— (no embedded time)'
              }
            />
          </ToolPane>

          <ToolPane
            title="Field layout"
            description="Every hex digit coloured by the role it plays in this UUID version."
          >
            <div className="flex flex-wrap items-end gap-1 font-mono text-sm">
              {parsed.info.fields.map((field, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span
                    className={`rounded px-1.5 py-1 ring-1 ${ROLE_STYLE[field.role]}`}
                    title={field.label}
                  >
                    {field.hex}
                  </span>
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                    {field.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
              {rolesPresent.map((role) => (
                <span key={role} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={`inline-block size-3 rounded-sm ring-1 ${ROLE_STYLE[role]}`} />
                  {ROLE_LABEL[role]}
                </span>
              ))}
            </div>
          </ToolPane>
        </>
      )}
    </ToolShell>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="block font-mono text-[13px] text-foreground/90">{value}</span>
    </div>
  )
}
