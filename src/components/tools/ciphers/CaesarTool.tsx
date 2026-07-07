import { Wand2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { StepStrip, type Step } from '@/components/common/StepStrip'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getToolById } from '@/data/tools'
import { useQueryState } from '@/hooks/useQueryState'
import { caesar, caesarSteps } from '@/lib/ciphers/caesar'
import { LETTERS, rankShifts } from '@/lib/ciphers/frequency'
import { cn } from '@/lib/utils'
import { AlphabetWheel } from './AlphabetWheel'
import { FrequencyChart } from './FrequencyChart'

const STEP_LIMIT = 60

export function CaesarTool() {
  const tool = getToolById('caesar')!
  const [text, setText] = useQueryState('in', 'THE QUICK BROWN FOX')
  const [shiftStr, setShiftStr] = useQueryState('shift', '3')
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const shift = Math.min(Math.max(parseInt(shiftStr, 10) || 0, 0), 25)

  const result = useMemo(() => caesar(text, shift, mode), [text, shift, mode])
  const steps = useMemo(() => caesarSteps(text, shift, mode).slice(0, STEP_LIMIT), [text, shift, mode])

  // Rank all 26 shifts by how English-like the decryption looks.
  const ranked = useMemo(() => rankShifts(text), [text])
  const bestGuess = ranked[0]

  const highlighted = useMemo(() => {
    const set = new Set<string>()
    for (const ch of text.toUpperCase()) {
      if (/[A-Z]/.test(ch)) set.add(ch)
    }
    return set
  }, [text])

  const stripSteps: Step[] = steps.map((s) => ({
    key: s.index,
    before: <span className="font-medium">{s.plain === ' ' ? '␣' : s.plain}</span>,
    after: <span>{s.cipher === ' ' ? '␣' : s.cipher}</span>,
    hint: s.shift !== null ? `+${s.shift}` : null,
    highlight: s.shift === null ? 'muted' : 'success',
  }))

  const applyGuess = () => {
    if (!bestGuess) return
    setMode('decrypt')
    setShiftStr(String(bestGuess.shift))
  }

  return (
    <ToolShell
      tool={tool}
      shareable
      explanation={
        <>
          <p>
            Caesar's cipher shifts every letter forward by a fixed amount, wrapping past Z back to
            A. Encryption shifts by <code>+N</code>; decryption shifts by <code>-N</code>. Non-letter
            characters pass through untouched.
          </p>
          <p>
            With only 26 possible shifts, brute force is trivial — but you don't even need to try
            them all by eye. <strong>Frequency analysis</strong> compares the letter counts of the
            ciphertext against English (E, T, A are most common) and scores each shift with a
            chi-squared test. The lowest score is almost always the right key.
          </p>
        </>
      }
    >
      <ToolPane title="Options" contentClassName="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'encrypt' | 'decrypt')}>
          <TabsList>
            <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
            <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex w-full max-w-xs items-center gap-3">
          <Label htmlFor="caesar-shift" className="shrink-0">
            Shift: <span className="tabular-nums text-primary">{shift}</span>
          </Label>
          <Slider
            id="caesar-shift"
            min={0}
            max={25}
            step={1}
            value={[shift]}
            onValueChange={(v) => setShiftStr(String(v[0]))}
          />
        </div>
      </ToolPane>

      <ToolPane title="Text" actions={text ? <CopyButton text={text} iconOnly /> : null}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          rows={3}
          className="font-sans"
        />
      </ToolPane>

      <ToolPane title="Alphabet wheel" description="Highlight follows the letters in your input.">
        <AlphabetWheel shift={shift} mode={mode} highlighted={highlighted} />
      </ToolPane>

      <ToolPane title="Result" actions={result ? <CopyButton text={result} iconOnly /> : null}>
        <div className="rounded-md border bg-background px-3 py-2 font-mono text-sm break-all">
          {result || <span className="text-muted-foreground">…</span>}
        </div>
      </ToolPane>

      <ToolPane
        title="Break it with frequency analysis"
        description="No key needed — score every shift against English letter frequencies."
        actions={
          bestGuess ? (
            <Button size="sm" onClick={applyGuess}>
              <Wand2 className="size-4" /> Auto-solve
            </Button>
          ) : null
        }
      >
        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Enter some ciphertext with letters to analyse.
          </p>
        ) : (
          <div className="space-y-4">
            <FrequencyChart text={text} />
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Top candidates by chi-squared score (lower = more English-like):
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {ranked.slice(0, 6).map((cand, i) => {
                  const preview = caesar(text, cand.shift, 'decrypt').slice(0, 28)
                  return (
                    <button
                      key={cand.shift}
                      type="button"
                      onClick={() => {
                        setMode('decrypt')
                        setShiftStr(String(cand.shift))
                      }}
                      className={cn(
                        'rounded-md border px-2.5 py-1.5 text-left transition-colors hover:bg-accent',
                        i === 0 ? 'border-success/50 bg-success/5' : 'bg-background',
                      )}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-primary">
                          shift {cand.shift} (key {LETTERS[cand.shift]})
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          χ²={cand.score.toFixed(1)}
                        </span>
                      </div>
                      <div className="truncate font-mono text-[11px] text-foreground/80">
                        {preview || '…'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </ToolPane>

      {steps.length > 0 && (
        <ToolPane
          title="Step by step"
          description={`Each character mapped through shift ${mode === 'decrypt' ? '−' : '+'}${shift}`}
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
