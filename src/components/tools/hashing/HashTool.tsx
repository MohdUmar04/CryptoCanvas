import { useEffect, useMemo, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getToolById } from '@/data/tools'
import { useDebounce } from '@/hooks/useDebounce'
import { bytesToBase64, bytesToHex, utf8ToBytes } from '@/lib/bytes'
import { digest, diffBytes, flipLastBit, HASH_ALGOS, type HashAlgo } from '@/lib/hashing'
import { cn } from '@/lib/utils'

type Encoding = 'hex' | 'base64'

function format(bytes: Uint8Array, encoding: Encoding): string {
  return encoding === 'hex' ? bytesToHex(bytes) : bytesToBase64(bytes)
}

export function HashTool() {
  const tool = getToolById('hash')!
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog')
  const [encoding, setEncoding] = useState<Encoding>('hex')
  const [hashes, setHashes] = useState<Record<HashAlgo, Uint8Array>>(() =>
    Object.fromEntries(HASH_ALGOS.map((a) => [a, new Uint8Array(0)])) as Record<
      HashAlgo,
      Uint8Array
    >,
  )
  const [tweakedHashes, setTweakedHashes] = useState<Record<HashAlgo, Uint8Array>>(() =>
    Object.fromEntries(HASH_ALGOS.map((a) => [a, new Uint8Array(0)])) as Record<
      HashAlgo,
      Uint8Array
    >,
  )

  const debouncedText = useDebounce(text, 80)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const data = utf8ToBytes(debouncedText)
      const tweaked = flipLastBit(data)
      const next: Record<HashAlgo, Uint8Array> = {} as Record<HashAlgo, Uint8Array>
      const nextTweaked: Record<HashAlgo, Uint8Array> = {} as Record<HashAlgo, Uint8Array>
      for (const algo of HASH_ALGOS) {
        const [a, b] = await Promise.all([digest(algo, data), digest(algo, tweaked)])
        if (cancelled) return
        next[algo] = a
        nextTweaked[algo] = b
      }
      if (!cancelled) {
        setHashes(next)
        setTweakedHashes(nextTweaked)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedText])

  const tweakedDisplay = useMemo(() => {
    const data = utf8ToBytes(debouncedText)
    const tweaked = flipLastBit(data)
    return bytesToHex(tweaked, ' ')
  }, [debouncedText])

  return (
    <ToolShell
      tool={tool}
      explanation={
        <>
          <p>
            A cryptographic hash function maps any input to a fixed-size digest. It's{' '}
            <em>one-way</em> — given the digest you can't reconstruct the input — and{' '}
            <em>collision-resistant</em>: it should be infeasible to find two inputs producing the
            same digest.
          </p>
          <p>
            <strong>MD5</strong> and <strong>SHA-1</strong> are broken for collision resistance and
            are listed here for educational purposes only. Use SHA-256 or higher for real work.
          </p>
        </>
      }
    >
      <ToolPane
        title="Options"
        contentClassName="flex flex-wrap items-end gap-x-6 gap-y-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hash-encoding">Output encoding</Label>
          <Select value={encoding} onValueChange={(v) => setEncoding(v as Encoding)}>
            <SelectTrigger id="hash-encoding" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hex">Hex</SelectItem>
              <SelectItem value="base64">Base64</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ToolPane>

      <ToolPane title="Input" actions={text ? <CopyButton text={text} iconOnly /> : null}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="font-sans"
          placeholder="Type or paste input…"
        />
      </ToolPane>

      <ToolPane title="Digests" description="Computed live as you type.">
        <div className="space-y-2">
          {HASH_ALGOS.map((algo) => {
            const out = hashes[algo]
            const formatted = out.length ? format(out, encoding) : ''
            return (
              <div
                key={algo}
                className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 rounded-md border bg-background px-3 py-2"
              >
                <span className="text-xs font-semibold text-primary">{algo}</span>
                <code className="overflow-x-auto whitespace-nowrap text-[12px] text-foreground/90">
                  {formatted || <span className="text-muted-foreground">—</span>}
                </code>
                {formatted && <CopyButton text={formatted} iconOnly />}
              </div>
            )
          })}
        </div>
      </ToolPane>

      <ToolPane
        title="Avalanche effect"
        description="Flip one bit of the last byte and watch the entire digest change."
      >
        <p className="mb-3 text-xs text-muted-foreground">
          Modified bytes (last byte XORed with <code>0x01</code>):{' '}
          <code className="text-foreground/90">{tweakedDisplay}</code>
        </p>
        <div className="space-y-3">
          {HASH_ALGOS.map((algo) => {
            const orig = hashes[algo]
            const twk = tweakedHashes[algo]
            if (!orig.length || !twk.length) return null
            const diff = diffBytes(orig, twk)
            return (
              <div key={algo} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-semibold text-primary">{algo}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {diff.bytesDiffering}/{orig.length} bytes,{' '}
                    {diff.bitsDiffering}/{diff.totalBits} bits differ
                  </span>
                </div>
                <ByteDiffRow bytes={orig} positions={diff.diffPositions} label="orig" />
                <ByteDiffRow bytes={twk} positions={diff.diffPositions} label="flip" />
              </div>
            )
          })}
        </div>
      </ToolPane>
    </ToolShell>
  )
}

function ByteDiffRow({
  bytes,
  positions,
  label,
}: {
  bytes: Uint8Array
  positions: boolean[]
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-0.5 font-mono text-[11px]">
        {[...bytes].map((b, i) => (
          <span
            key={i}
            className={cn(
              'rounded px-1 py-px tabular-nums',
              positions[i]
                ? 'bg-warning/20 text-warning-foreground/90 ring-1 ring-warning/40'
                : 'text-muted-foreground',
            )}
          >
            {b.toString(16).padStart(2, '0')}
          </span>
        ))}
      </div>
    </div>
  )
}
