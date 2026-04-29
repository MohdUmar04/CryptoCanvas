import { motion } from 'motion/react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type Highlight = 'primary' | 'success' | 'info' | 'warning' | 'muted'

export type Step = {
  key: string | number
  before: React.ReactNode
  after: React.ReactNode
  hint?: React.ReactNode
  highlight?: Highlight
}

type Props = {
  steps: Step[]
  className?: string
  arrow?: boolean
}

const highlightClass: Record<Highlight, string> = {
  primary: 'border-primary/40 bg-primary/5',
  success: 'border-success/40 bg-success/5',
  info: 'border-info/40 bg-info/5',
  warning: 'border-warning/40 bg-warning/5',
  muted: 'border-border bg-card',
}

export function StepStrip({ steps, className, arrow = true }: Props) {
  return (
    <div className={cn('flex flex-wrap items-stretch gap-1.5', className)}>
      {steps.map((step, i) => (
        <motion.div
          key={step.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.012, 0.25), duration: 0.18 }}
          className={cn(
            'flex min-w-[2.5rem] flex-col items-center gap-0.5 rounded-md border px-2 py-1.5 font-mono text-xs',
            highlightClass[step.highlight ?? 'muted'],
          )}
        >
          <span className="text-muted-foreground">{step.before}</span>
          {arrow && <span className="text-muted-foreground/50 leading-none">↓</span>}
          <span className="font-medium text-foreground">{step.after}</span>
          {step.hint && (
            <span className="mt-0.5 text-[10px] text-muted-foreground">{step.hint}</span>
          )}
        </motion.div>
      ))}
    </div>
  )
}
