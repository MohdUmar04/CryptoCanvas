import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

type Props = {
  bytes: Uint8Array
  /** Indices of bytes that have been flipped relative to the original. */
  flippedSet?: Set<number>
  onFlip: (index: number) => void
  /** Optional label rendered above the grid. */
  label?: string
  /** Tinted to the color of whichever component these bytes belong to (e.g. tag vs ciphertext). */
  tone?: 'default' | 'tag'
}

export function ByteFlipper({ bytes, flippedSet, onFlip, label, tone = 'default' }: Props) {
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{label}</span>
          <span className="font-mono">{bytes.length} B</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {Array.from(bytes).map((b, i) => {
          const flipped = flippedSet?.has(i) ?? false
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => onFlip(i)}
              whileTap={{ scale: 0.85 }}
              animate={flipped ? { scale: [1, 1.25, 1] } : {}}
              transition={{ duration: 0.25 }}
              className={cn(
                'inline-flex h-7 min-w-[2.1rem] items-center justify-center rounded border px-1 font-mono text-[11px] tabular-nums transition-colors cursor-pointer select-none',
                'hover:border-primary hover:bg-accent',
                flipped
                  ? 'border-destructive/60 bg-destructive/15 text-destructive font-semibold'
                  : tone === 'tag'
                    ? 'border-warning/40 bg-warning/5 text-foreground/90'
                    : 'border-border bg-background text-foreground/80',
              )}
              title={`byte ${i} · ${flipped ? 'click to flip again' : 'click to flip a bit'}`}
            >
              {b.toString(16).padStart(2, '0')}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
