import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

type Props = {
  token: string
  className?: string
  partsCount?: 3 | 5
  /** Animate each part appearing in sequence on mount/key-change. */
  animate?: boolean
  /** Index of a part to give a "dropped-in" emphasis (scale + glow). */
  highlightIndex?: number
}

const PART_COLORS = ['text-jwt-header', 'text-jwt-payload', 'text-jwt-signature'] as const

const FIVE_COLORS = [
  'text-jwt-header',
  'text-jwt-payload',
  'text-warning',
  'text-jwt-payload',
  'text-jwt-signature',
] as const

export function ColoredToken({
  token,
  className,
  partsCount = 3,
  animate = false,
  highlightIndex,
}: Props) {
  const parts = token.split('.')
  const colors = partsCount === 5 ? FIVE_COLORS : PART_COLORS
  return (
    <div
      className={cn(
        'rounded-md border bg-background p-3 font-mono text-[12px] leading-relaxed break-all',
        className,
      )}
    >
      {parts.length === 0 ? (
        <span className="text-muted-foreground">…</span>
      ) : (
        parts.map((part, i) => {
          const isHighlight = animate && highlightIndex === i
          const content = (
            <>
              {i > 0 && <span className="text-muted-foreground/60">.</span>}
              <span className={colors[i] ?? 'text-foreground'}>{part}</span>
            </>
          )
          if (!animate) {
            return <span key={i}>{content}</span>
          }
          return (
            <motion.span
              key={i}
              initial={
                isHighlight
                  ? { opacity: 0, scale: 1.4, filter: 'blur(2px)' }
                  : { opacity: 0, y: 4 }
              }
              animate={
                isHighlight
                  ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                  : { opacity: 1, y: 0 }
              }
              transition={{
                duration: isHighlight ? 0.45 : 0.22,
                delay: i * 0.12 + (isHighlight ? 0.05 : 0),
                ease: 'easeOut',
              }}
              style={{ display: 'inline' }}
            >
              {content}
            </motion.span>
          )
        })
      )}
    </div>
  )
}
