import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import * as React from 'react'
import type { Tool } from '@/data/tools'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  tool: Tool
  explanation?: React.ReactNode
  headerExtras?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ToolShell({ tool, explanation, headerExtras, children, className }: Props) {
  const [showExplanation, setShowExplanation] = useState(false)
  const Icon = tool.icon
  return (
    <div className={cn('px-4 py-6 sm:px-6 sm:py-8', className)}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-primary">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {tool.title}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{tool.blurb}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {headerExtras}
          {explanation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanation((s) => !s)}
              aria-expanded={showExplanation}
            >
              How it works
              <ChevronDown
                className={cn(
                  'size-4 transition-transform duration-200',
                  showExplanation && 'rotate-180',
                )}
              />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showExplanation && explanation && (
          <motion.div
            key="exp"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-5 overflow-hidden"
          >
            <div className="rounded-lg border bg-card/50 p-4 text-sm leading-relaxed text-foreground/90 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_p]:mb-2 last:[&_p]:mb-0">
              {explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        {children}
      </motion.div>
    </div>
  )
}
