import { Wand2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { StepStrip, type Step } from '@/components/common/StepStrip'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getToolById } from '@/data/tools'
import { useQueryState } from '@/hooks/useQueryState'
import { vigenere, vigenereSteps } from '@/lib/ciphers/vigenere'
import { crackVigenere, indexOfCoincidence } from '@/lib/ciphers/frequency'
import { cn } from '@/lib/utils'

const STEP_LIMIT = 60

export function VigenereTool() {
  const tool = getToolById('vigenere')!
  const [text, setText] = useQueryState('in', 'ATTACK AT DAWN')
  const [key, setKey] = useQueryState('key', 'LEMON')
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')

  const { result, error } = useMemo(() => {
    try {
      return { result: vigenere(text, key, mode), error: null as string | null }
    } catch (e) {
      return { result: '', error: e instanceof Error ? e.message : String(e) }
    }
  }, [text, key, mode])

  const steps = useMemo(() => {
    try {
      return vigenereSteps(text, key, mode).slice(0, STEP_LIMIT)
    } catch {
      return []
    }
  }, [text, key, mode])

  const crack = useMemo(() => {
    try {
      return { result: crackVigenere(text), error: null as string | null }
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) }
    }
  }, [text])
  const ic = useMemo(() => indexOfCoincidence(text), [text])

  const stripSteps: Step[] = steps.map((s) => ({
    key: s.index,
    before: <span className="font-medium">{s.plain === ' ' ? '␣' : s.plain}</span>,
    after: <span>{s.cipher === ' ' ? '␣' : s.cipher}</span>,
    hint:
      s.keyLetter !== null ? (
        <span>
          <span className="text-info">{s.keyLetter}</span>
          {' (+' + s.shift + ')'}
        </span>
      ) : null,
    highlight: s.keyLetter === null ? 'muted' : 'info',
  }))

  return (
    <ToolShell
      tool={tool}
      shareable
      explanation={
        <>
          <p>
            Vigenère stretches Caesar with a repeating keyword. Each letter of the keyword sets a
            shift for the corresponding plaintext letter; the keyword cycles for the rest of the
            message. Only A–Z letters are shifted — spaces and punctuation pass through untouched
            and don't advance the key index.
          </p>
          <p>
            Famously dubbed <em>le chiffre indéchiffrable</em> for centuries — until Kasiski and
            Babbage worked out how to break it. The <strong>index of coincidence</strong> reveals
            the key length; then each key position becomes an independent Caesar cipher you can
            crack with frequency analysis. The auto-solver below does exactly that.
          </p>
        </>
      }
    >
      <ToolPane title="Options" contentClassName="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'encrypt' | 'decrypt')}>
          <TabsList>
            <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
            <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="vig-key">Keyword</Label>
          <Input
            id="vig-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="LEMON"
            className="font-mono uppercase"
          />
        </div>
      </ToolPane>

      <ToolPane title="Plaintext" actions={text ? <CopyButton text={text} iconOnly /> : null}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="font-sans"
        />
      </ToolPane>

      <ToolPane title="Result" actions={result ? <CopyButton text={result} iconOnly /> : null}>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="rounded-md border bg-background px-3 py-2 font-mono text-sm break-all">
            {result || <span className="text-muted-foreground">…</span>}
          </div>
        )}
      </ToolPane>

      <ToolPane
        title="Break it (Kasiski / Friedman)"
        description="Estimate the key length from the index of coincidence, then solve each column."
        actions={
          crack.result ? (
            <Button
              size="sm"
              onClick={() => {
                setMode('decrypt')
                setKey(crack.result.key)
              }}
            >
              <Wand2 className="size-4" /> Auto-solve
            </Button>
          ) : null
        }
      >
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-md border bg-background px-2.5 py-1">
            Index of coincidence:{' '}
            <span className="font-mono tabular-nums text-primary">{ic.toFixed(4)}</span>
          </span>
          <span className="rounded-md border bg-background px-2.5 py-1 text-muted-foreground">
            English ≈ 0.067 · random ≈ 0.038
          </span>
        </div>
        {!crack.result ? (
          <p className="text-sm text-muted-foreground">{crack.error}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span>
                Recovered key:{' '}
                <span className="font-mono font-semibold text-success">{crack.result.key}</span>
              </span>
              <span className="text-muted-foreground">(length {crack.result.keyLength})</span>
            </div>
            <div className="rounded-md border bg-background px-3 py-2 font-mono text-sm break-all">
              {crack.result.plaintext}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {crack.result.keyLengthCandidates.slice(0, 8).map((c) => (
                <span
                  key={c.length}
                  className={cn(
                    'rounded border px-2 py-0.5 text-[11px] tabular-nums',
                    c.length === crack.result.keyLength
                      ? 'border-primary/50 bg-primary/5 text-primary'
                      : 'text-muted-foreground',
                  )}
                >
                  len {c.length}: {c.ic.toFixed(3)}
                </span>
              ))}
            </div>
          </div>
        )}
      </ToolPane>

      {steps.length > 0 && (
        <ToolPane
          title="Step by step"
          description="Each plaintext letter shifted by its paired keyword letter."
        >
          <StepStrip steps={stripSteps} />
          {steps.length === STEP_LIMIT && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing the first {STEP_LIMIT} characters.
            </p>
          )}
        </ToolPane>
      )}
    </ToolShell>
  )
}
