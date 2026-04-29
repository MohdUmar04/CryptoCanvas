import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { ToolPane } from '@/components/common/ToolPane'
import { Button } from '@/components/ui/button'
import { aesEncryptBlockSteps, diffIndices, type AesStep } from '@/lib/aes-rounds'
import { bytesToHex, hexToBytes, utf8ToBytes } from '@/lib/bytes'
import type { KeySizeBits } from '@/lib/symmetric'
import { cn } from '@/lib/utils'

type Props = {
  /** Current AES key (hex). */
  keyHex: string
  /** Current AES key size in bits — used to validate the key length. */
  keyBits: KeySizeBits
  /** Plaintext from the tool — only the first 16 bytes are visualized. */
  plaintext: string
}

export function AesRoundVisualizer({ keyHex, keyBits, plaintext }: Props) {
  const block = useMemo(() => firstBlock(plaintext), [plaintext])
  const keyBytes = useMemo(() => safeKey(keyHex, keyBits), [keyHex, keyBits])

  const steps = useMemo<AesStep[] | null>(() => {
    if (!keyBytes) return null
    try {
      return aesEncryptBlockSteps(block, keyBytes)
    } catch {
      return null
    }
  }, [block, keyBytes])

  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  // Reset to step 0 whenever the inputs change.
  useEffect(() => {
    setStepIndex(0)
    setPlaying(false)
  }, [steps])

  // Auto-advance when playing. The effect re-creates the interval on every
  // play/pause toggle, so a stale `playing` closure can't keep ticking.
  useEffect(() => {
    if (!playing || !steps) return
    const id = setInterval(() => {
      setStepIndex((i) => {
        if (i >= steps.length - 1) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, 600)
    return () => clearInterval(id)
  }, [playing, steps])

  if (!steps) {
    return (
      <ToolPane
        title="Round-by-round visualizer"
        description={`Set a valid ${keyBits}-bit key (${keyBits / 8} hex bytes) to inspect each AES round.`}
      >
        <div className="rounded-md border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
          Visualizer waiting for a valid key…
        </div>
      </ToolPane>
    )
  }

  const current = steps[stepIndex]
  const previous = stepIndex > 0 ? steps[stepIndex - 1] : null
  const changed = previous ? diffIndices(previous.state, current.state) : []
  const totalRounds = steps[steps.length - 1].round

  return (
    <ToolPane
      title="Round-by-round visualizer"
      description={`AES-${keyBits} encrypts one 16-byte block through ${totalRounds} rounds. Click step / play to walk through.`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPlaying(false)
              setStepIndex((i) => Math.max(0, i - 1))
            }}
            disabled={stepIndex === 0}
          >
            <ChevronLeft className="size-3.5" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPlaying(false)
              setStepIndex((i) => Math.min(steps.length - 1, i + 1))
            }}
            disabled={stepIndex === steps.length - 1}
          >
            Next <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlaying((p) => !p)}
            disabled={stepIndex === steps.length - 1}
          >
            {playing ? (
              <>
                <Pause className="size-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="size-3.5" /> Play
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPlaying(false)
              setStepIndex(steps.length - 1)
            }}
            disabled={stepIndex === steps.length - 1}
          >
            <SkipForward className="size-3.5" /> End
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPlaying(false)
              setStepIndex(0)
            }}
            disabled={stepIndex === 0}
          >
            <RotateCcw className="size-3.5" /> Reset
          </Button>
          <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
            step {stepIndex + 1} / {steps.length}
          </span>
        </div>

        {/* Progress strip */}
        <div className="flex h-1.5 overflow-hidden rounded bg-muted">
          <motion.div
            className="bg-primary"
            animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>

        <div className="rounded-md border bg-card/40 p-3">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="font-medium text-sm">{current.label}</span>
            <span className="font-mono text-xs text-muted-foreground">
              round {current.round} / {totalRounds}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{describeOp(current.op)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">State (4×4)</div>
            <StateGrid state={current.state} highlight={changed} />
          </div>
          {current.roundKey && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                Round key {current.round}
              </div>
              <StateGrid state={current.roundKey} muted />
            </div>
          )}
        </div>

        <div className="rounded-md border bg-background px-3 py-2 font-mono text-[11px] break-all">
          <span className="text-muted-foreground">hex · </span>
          {bytesToHex(current.state)}
        </div>
      </div>
    </ToolPane>
  )
}

function StateGrid({
  state,
  highlight = [],
  muted = false,
}: {
  state: Uint8Array
  highlight?: number[]
  muted?: boolean
}) {
  // state is column-major: state[c*4 + r]. Render rows × columns.
  const highlightSet = new Set(highlight)
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => {
          const idx = c * 4 + r
          const value = state[idx]
          const isChanged = highlightSet.has(idx)
          return (
            <motion.div
              key={`${r}-${c}`}
              animate={
                isChanged
                  ? { scale: [1, 1.18, 1], backgroundColor: 'rgba(239,68,68,0.18)' }
                  : { scale: 1 }
              }
              transition={{ duration: 0.35 }}
              className={cn(
                'flex aspect-square items-center justify-center rounded border font-mono text-[12px] tabular-nums',
                isChanged
                  ? 'border-destructive/60 text-destructive font-semibold'
                  : muted
                    ? 'border-border/60 bg-card/40 text-foreground/70'
                    : 'border-border bg-background text-foreground',
              )}
            >
              {value.toString(16).padStart(2, '0')}
            </motion.div>
          )
        }),
      )}
    </div>
  )
}

const OP_DESCRIPTIONS: Record<AesStep['op'], string> = {
  init: 'Initial AddRoundKey: XORs the plaintext block with round key 0 before any rounds.',
  subBytes:
    'SubBytes: each byte replaced via the AES S-box. Non-linear — this is what makes AES hard to invert.',
  shiftRows:
    'ShiftRows: row r is rotated left by r bytes. Mixes columns into each other.',
  mixColumns:
    'MixColumns: each column multiplied by a fixed matrix in GF(2⁸). Diffuses every byte across its column.',
  addRoundKey: 'AddRoundKey: XORs the state with the round key for this round.',
  final:
    'Final AddRoundKey: round-key XOR for the last round (no MixColumns) — produces the ciphertext block.',
}

function describeOp(op: AesStep['op']): string {
  return OP_DESCRIPTIONS[op]
}

/** Pull the first 16 bytes of plaintext, zero-padded if shorter. */
function firstBlock(plaintext: string): Uint8Array {
  const utf = utf8ToBytes(plaintext)
  const out = new Uint8Array(16)
  out.set(utf.slice(0, 16))
  return out
}

function safeKey(hex: string, keyBits: KeySizeBits): Uint8Array | null {
  try {
    const k = hexToBytes(hex)
    if (k.length !== keyBits / 8) return null
    return k
  } catch {
    return null
  }
}
