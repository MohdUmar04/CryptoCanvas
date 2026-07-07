import { motion } from 'motion/react'
import { ENGLISH_FREQ, LETTERS, letterFrequencies } from '@/lib/ciphers/frequency'

/**
 * Overlaid bar chart: observed letter frequencies of `text` (bars) against
 * English's reference distribution (ticks). Makes the "signature" of a
 * monoalphabetic cipher visible at a glance.
 */
export function FrequencyChart({ text }: { text: string }) {
  const freqs = letterFrequencies(text)
  const max = Math.max(...freqs, ...ENGLISH_FREQ, 1)

  return (
    <div>
      <div className="flex h-32 items-end gap-[3px]">
        {LETTERS.map((letter, i) => {
          const obs = (freqs[i] / max) * 100
          const eng = (ENGLISH_FREQ[i] / max) * 100
          return (
            <div key={letter} className="relative flex flex-1 flex-col justify-end">
              {/* English reference tick */}
              <div
                className="absolute inset-x-0 border-t border-dashed border-muted-foreground/50"
                style={{ bottom: `${eng}%` }}
              />
              <motion.div
                className="rounded-t-sm bg-primary/70"
                initial={{ height: 0 }}
                animate={{ height: `${obs}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-[3px]">
        {LETTERS.map((letter) => (
          <span
            key={letter}
            className="flex-1 text-center font-mono text-[9px] text-muted-foreground"
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3 rounded-sm bg-primary/70" /> your text
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 border-t border-dashed border-muted-foreground/70" />{' '}
          English reference
        </span>
      </div>
    </div>
  )
}
