import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

type Props = {
  shift: number // raw user shift, before mode adjustment
  mode: 'encrypt' | 'decrypt'
  highlighted: Set<string>
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function AlphabetWheel({ shift, mode, highlighted }: Props) {
  const sign = mode === 'encrypt' ? 1 : -1
  const n = (((sign * shift) % 26) + 26) % 26
  const cipherRow = ALPHA.slice(n) + ALPHA.slice(0, n)

  return (
    <div className="space-y-1.5 overflow-x-auto pb-1">
      <Row label="A → Z" letters={ALPHA} highlighted={highlighted} variant="plain" />
      <Row label="cipher" letters={cipherRow} highlighted={highlighted} variant="cipher" />
    </div>
  )
}

function Row({
  label,
  letters,
  highlighted,
  variant,
}: {
  label: string
  letters: string
  highlighted: Set<string>
  variant: 'plain' | 'cipher'
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex gap-0.5">
        {[...letters].map((c, i) => {
          const referenceLetter = variant === 'plain' ? c : ALPHA[i]
          const active = highlighted.has(referenceLetter)
          return (
            <motion.span
              key={`${variant}-${i}-${c}`}
              initial={variant === 'cipher' ? { y: -2, opacity: 0 } : false}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-md border text-xs font-mono',
                active && variant === 'plain' && 'border-primary bg-primary/10 text-primary',
                active && variant === 'cipher' && 'border-success bg-success/10 text-success',
                !active && 'border-border bg-card text-muted-foreground',
              )}
            >
              {c}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}
