import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { StepStrip, type Step } from '@/components/common/StepStrip'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getToolById } from '@/data/tools'
import { caesar, caesarSteps } from '@/lib/ciphers/caesar'
import { AlphabetWheel } from './AlphabetWheel'

const STEP_LIMIT = 60

export function CaesarTool() {
  const tool = getToolById('caesar')!
  const [text, setText] = useState('THE QUICK BROWN FOX')
  const [shift, setShift] = useState(3)
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')

  const result = useMemo(() => caesar(text, shift, mode), [text, shift, mode])
  const steps = useMemo(() => caesarSteps(text, shift, mode).slice(0, STEP_LIMIT), [text, shift, mode])

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

  return (
    <ToolShell
      tool={tool}
      explanation={
        <>
          <p>
            Caesar's cipher shifts every letter forward by a fixed amount, wrapping past Z back to
            A. Encryption shifts by <code>+N</code>; decryption shifts by <code>-N</code>. Non-letter
            characters pass through untouched.
          </p>
          <p>
            With only 26 possible shifts, brute force is trivial — try each shift and see which
            one looks like English. That's why Caesar is mostly a teaching tool today.
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
            onValueChange={(v) => setShift(v[0])}
          />
        </div>
      </ToolPane>

      <ToolPane title="Plaintext" actions={text ? <CopyButton text={text} iconOnly /> : null}>
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
