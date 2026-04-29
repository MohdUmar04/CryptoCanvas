import { Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Status } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = { status: Status; className?: string }

export function StatusPulse({ status, className }: Props) {
  const showing = status.kind !== 'idle'
  const isOk = status.kind === 'success'
  return (
    <AnimatePresence mode="wait">
      {showing && (
        <motion.div
          key={`${status.kind}-${status.message ?? ''}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
            isOk
              ? 'border-success/40 bg-success/10 text-success animate-pulse-success'
              : 'border-destructive/40 bg-destructive/10 text-destructive animate-shake-x',
            className,
          )}
        >
          {isOk ? <Check className="size-3.5" /> : <X className="size-3.5" />}
          {status.message ?? (isOk ? 'Verified' : 'Failed')}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
