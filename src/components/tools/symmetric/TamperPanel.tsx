import { RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { ToolPane } from '@/components/common/ToolPane'
import { Button } from '@/components/ui/button'
import { bytesToUtf8, hexToBytes } from '@/lib/bytes'
import { aesDecrypt, type AesMode } from '@/lib/symmetric'
import { ByteFlipper } from './ByteFlipper'

type Props = {
  mode: AesMode
  keyHex: string
  ivHex: string
  ciphertextHex: string
  tagHex: string
  aad: string
}

type Outcome =
  | { kind: 'pristine'; plaintext: string }
  | { kind: 'ok'; plaintext: string }
  | { kind: 'fail'; message: string }
  | { kind: 'pending' }

export function TamperPanel({ mode, keyHex, ivHex, ciphertextHex, tagHex, aad }: Props) {
  const ctOriginal = useMemo(() => safeHex(ciphertextHex), [ciphertextHex])
  const tagOriginal = useMemo(() => safeHex(tagHex), [tagHex])

  const [ct, setCt] = useState<Uint8Array>(() => ctOriginal.slice())
  const [tag, setTag] = useState<Uint8Array>(() => tagOriginal.slice())
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'pending' })

  // Reset whenever the upstream encryption changes.
  useEffect(() => {
    setCt(ctOriginal.slice())
    setTag(tagOriginal.slice())
  }, [ctOriginal, tagOriginal])

  const flippedCt = useMemo(() => diffSet(ct, ctOriginal), [ct, ctOriginal])
  const flippedTag = useMemo(() => diffSet(tag, tagOriginal), [tag, tagOriginal])
  const isTampered = flippedCt.size > 0 || flippedTag.size > 0

  // Auto-decrypt whenever the bytes change.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const out = await aesDecrypt({
          mode,
          key: hexToBytes(keyHex),
          iv: hexToBytes(ivHex),
          ciphertext: ct,
          tag: mode === 'AES-GCM' ? tag : undefined,
          aad: aad ? new TextEncoder().encode(aad) : undefined,
        })
        if (cancelled) return
        const plaintext = bytesToUtf8(out)
        setOutcome({ kind: isTampered ? 'ok' : 'pristine', plaintext })
      } catch (e) {
        if (cancelled) return
        setOutcome({
          kind: 'fail',
          message: e instanceof Error ? e.message : 'Decryption failed.',
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode, keyHex, ivHex, ct, tag, aad, isTampered])

  const reset = () => {
    setCt(ctOriginal.slice())
    setTag(tagOriginal.slice())
  }

  const flipCt = (i: number) => {
    const next = ct.slice()
    next[i] ^= 0x01
    setCt(next)
  }
  const flipTag = (i: number) => {
    const next = tag.slice()
    next[i] ^= 0x01
    setTag(next)
  }

  return (
    <ToolPane
      title="Tamper-resistance demo"
      description={
        mode === 'AES-GCM'
          ? 'Click any ciphertext or tag byte to flip its lowest bit. GCM detects every change.'
          : 'Click any ciphertext byte to flip its lowest bit. CBC has no tamper detection — it just produces garbled plaintext.'
      }
      actions={
        isTampered ? (
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        ) : null
      }
    >
      <div className="space-y-3">
        <ByteFlipper
          label="Ciphertext"
          bytes={ct}
          flippedSet={flippedCt}
          onFlip={flipCt}
        />
        {mode === 'AES-GCM' && (
          <ByteFlipper
            label="Auth tag"
            bytes={tag}
            flippedSet={flippedTag}
            onFlip={flipTag}
            tone="tag"
          />
        )}

        <OutcomeBox outcome={outcome} mode={mode} tampered={isTampered} />
      </div>
    </ToolPane>
  )
}

function OutcomeBox({
  outcome,
  mode,
  tampered,
}: {
  outcome: Outcome
  mode: AesMode
  tampered: boolean
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={outcome.kind + (outcome.kind === 'fail' ? outcome.message : '')}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
        className={
          outcome.kind === 'fail'
            ? 'flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive animate-shake-x'
            : tampered
              ? 'flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-foreground'
              : 'flex items-start gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-foreground animate-pulse-success'
        }
      >
        {outcome.kind === 'fail' ? (
          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="size-4 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          {outcome.kind === 'pristine' && (
            <div>
              <div className="text-xs font-medium">Pristine — round-trip OK</div>
              <pre className="mt-1 font-mono text-[12px] whitespace-pre-wrap break-all">
                {outcome.plaintext || <span className="text-muted-foreground">(empty)</span>}
              </pre>
            </div>
          )}
          {outcome.kind === 'ok' && (
            <div>
              <div className="text-xs font-medium">
                {mode === 'AES-CBC'
                  ? 'CBC decrypted to garbled bytes — no tamper detection.'
                  : 'Decrypted (somehow — flip more bits!).'}
              </div>
              <pre className="mt-1 font-mono text-[12px] whitespace-pre-wrap break-all">
                {outcome.plaintext || <span className="text-muted-foreground">(empty)</span>}
              </pre>
            </div>
          )}
          {outcome.kind === 'fail' && (
            <div>
              <div className="text-xs font-semibold">
                {mode === 'AES-GCM'
                  ? 'GCM rejected the ciphertext — auth tag mismatch.'
                  : 'CBC decrypt failed (padding error).'}
              </div>
              <div className="mt-1 text-[12px] opacity-80">{outcome.message}</div>
            </div>
          )}
          {outcome.kind === 'pending' && (
            <div className="text-xs text-muted-foreground">Decrypting…</div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function safeHex(hex: string): Uint8Array {
  try {
    return hexToBytes(hex)
  } catch {
    return new Uint8Array(0)
  }
}

function diffSet(a: Uint8Array, b: Uint8Array): Set<number> {
  const out = new Set<number>()
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) out.add(i)
  return out
}
