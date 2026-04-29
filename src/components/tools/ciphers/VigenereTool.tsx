import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { StepStrip, type Step } from '@/components/common/StepStrip'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getToolById } from '@/data/tools'
import { vigenere, vigenereSteps } from '@/lib/ciphers/vigenere'

const STEP_LIMIT = 60

export function VigenereTool() {
  const tool = getToolById('vigenere')!
  const [text, setText] = useState('ATTACK AT DAWN')
  const [key, setKey] = useState('LEMON')
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
            Babbage worked out how to detect the key length and break it. Still a great teaching
            example of polyalphabetic substitution.
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
