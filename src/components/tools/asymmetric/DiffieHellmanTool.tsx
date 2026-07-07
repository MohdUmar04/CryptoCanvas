import { ArrowRight, Eye, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { getToolById } from '@/data/tools'
import { DH_GROUPS, dhExchange, randomSecret } from '@/lib/dh'
import { cn } from '@/lib/utils'

/** Map a shared-secret number to a stable hue so both sides visibly match. */
function hueFor(secret: number, p: number): number {
  return Math.round((secret / p) * 360)
}

function Swatch({ value, p, label }: { value: number; p: number; label: string }) {
  const hue = hueFor(value, p)
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block size-8 shrink-0 rounded-md border"
        style={{ backgroundColor: `hsl(${hue} 70% 55%)` }}
      />
      <div className="leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-sm tabular-nums">{value}</span>
      </div>
    </div>
  )
}

export function DiffieHellmanTool() {
  const tool = getToolById('dh')!
  const [groupIdx, setGroupIdx] = useState(0)
  const { p, g } = DH_GROUPS[groupIdx]
  const [a, setA] = useState(6)
  const [b, setB] = useState(15)

  // Clamp private keys whenever the group (and thus p) changes.
  const clampedA = Math.min(a, p - 2)
  const clampedB = Math.min(b, p - 2)

  const ex = useMemo(
    () => dhExchange(p, g, clampedA, clampedB),
    [p, g, clampedA, clampedB],
  )
  const agree = ex.secretAlice === ex.secretBob

  const randomize = () => {
    setA(randomSecret(p))
    setB(randomSecret(p))
  }

  return (
    <ToolShell
      tool={tool}
      explanation={
        <>
          <p>
            <strong>Diffie–Hellman</strong> lets two people agree on a shared secret over a public
            channel — without ever sending the secret itself. They publicly agree on a prime{' '}
            <code>p</code> and base <code>g</code>. Each picks a private number (Alice's{' '}
            <code>a</code>, Bob's <code>b</code>) and sends the other{' '}
            <code>g^private mod p</code>.
          </p>
          <p>
            The magic is that <code>(g^a)^b = (g^b)^a mod p</code>, so both compute the same shared
            value — but an eavesdropper who sees <code>g</code>, <code>p</code>, <code>g^a</code>{' '}
            and <code>g^b</code> would have to solve the <em>discrete logarithm</em> problem to
            recover it. Easy with these toy numbers; infeasible at 2048+ bits.
          </p>
        </>
      }
    >
      <ToolPane title="Public parameters" contentClassName="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dh-group">Prime group</Label>
          <Select value={String(groupIdx)} onValueChange={(v) => setGroupIdx(Number(v))}>
            <SelectTrigger id="dh-group" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DH_GROUPS.map((grp, i) => (
                <SelectItem key={grp.p} value={String(i)}>
                  p = {grp.p}, g = {grp.g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border bg-background px-3 py-2 font-mono text-sm">
          p = <span className="text-primary">{p}</span> · g ={' '}
          <span className="text-primary">{g}</span>
        </div>
        <Button variant="outline" onClick={randomize}>
          <RefreshCw className="size-4" /> Randomize keys
        </Button>
      </ToolPane>

      <div className="grid gap-4 lg:grid-cols-2">
        <Party
          name="Alice"
          accent="text-info"
          priv={clampedA}
          setPriv={setA}
          p={p}
          g={g}
          pub={ex.A}
          otherPub={ex.B}
          otherName="Bob"
          secret={ex.secretAlice}
        />
        <Party
          name="Bob"
          accent="text-success"
          priv={clampedB}
          setPriv={setB}
          p={p}
          g={g}
          pub={ex.B}
          otherPub={ex.A}
          otherName="Alice"
          secret={ex.secretBob}
        />
      </div>

      <ToolPane title="Shared secret">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <Swatch value={ex.secretAlice} p={p} label="Alice computes" />
            <span className="text-muted-foreground">
              {agree ? '=' : '≠'}
            </span>
            <Swatch value={ex.secretBob} p={p} label="Bob computes" />
          </div>
          <span
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm font-medium',
              agree
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-destructive/40 bg-destructive/10 text-destructive',
            )}
          >
            {agree ? `Both agree on ${ex.secretAlice}` : 'Mismatch'}
          </span>
        </div>
      </ToolPane>

      <ToolPane
        title="What Eve sees"
        description="Everything on the public wire — but not the shared secret."
      >
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <Eye className="size-4 text-muted-foreground" />
          <span className="rounded border bg-background px-2 py-1">p = {p}</span>
          <span className="rounded border bg-background px-2 py-1">g = {g}</span>
          <span className="rounded border bg-background px-2 py-1">
            g<sup>a</sup> = {ex.A}
          </span>
          <span className="rounded border bg-background px-2 py-1">
            g<sup>b</sup> = {ex.B}
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
          <span className="rounded border border-dashed px-2 py-1 text-muted-foreground">
            secret? must solve discrete log
          </span>
        </div>
      </ToolPane>
    </ToolShell>
  )
}

function Party({
  name,
  accent,
  priv,
  setPriv,
  p,
  g,
  pub,
  otherPub,
  otherName,
  secret,
}: {
  name: string
  accent: string
  priv: number
  setPriv: (n: number) => void
  p: number
  g: number
  pub: number
  otherPub: number
  otherName: string
  secret: number
}) {
  return (
    <ToolPane title={<span className={accent}>{name}</span>}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Label className="w-28 shrink-0">
            Private:{' '}
            <span className={cn('font-mono tabular-nums', accent)}>{priv}</span>
          </Label>
          <Slider
            min={2}
            max={p - 2}
            step={1}
            value={[priv]}
            onValueChange={(v) => setPriv(v[0])}
          />
        </div>
        <div className="space-y-1.5 font-mono text-sm">
          <div className="rounded-md border bg-background px-3 py-1.5">
            public = {g}
            <sup>{priv}</sup> mod {p} = <span className={accent}>{pub}</span>
          </div>
          <div className="rounded-md border bg-background px-3 py-1.5 text-muted-foreground">
            ← {otherName} sends {otherPub}
          </div>
          <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5">
            secret = {otherPub}
            <sup>{priv}</sup> mod {p} ={' '}
            <span className="font-semibold text-primary">{secret}</span>
          </div>
        </div>
      </div>
    </ToolPane>
  )
}
