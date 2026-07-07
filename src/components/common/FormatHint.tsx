import { Lightbulb } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getToolById } from '@/data/tools'
import { useDebounce } from '@/hooks/useDebounce'
import { detectFormats } from '@/lib/detect'

/**
 * Watches an input value and, when it looks like a known format handled better
 * by another tool, offers a one-click jump that carries the value along.
 */
export function FormatHint({ value, exclude }: { value: string; exclude?: string }) {
  const debounced = useDebounce(value, 250)
  const suggestion = useMemo(() => {
    const hits = detectFormats(debounced).filter((s) => s.toolId !== exclude)
    return hits[0]
  }, [debounced, exclude])

  const tool = suggestion ? getToolById(suggestion.toolId) : undefined

  return (
    <AnimatePresence initial={false}>
      {suggestion && tool && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-info/40 bg-info/5 px-3 py-2 text-sm">
            <Lightbulb className="size-4 shrink-0 text-info" />
            <span className="text-foreground/90">
              This looks like <span className="font-medium">{suggestion.label}</span>.
            </span>
            <Link
              to={`${tool.route}?${suggestion.param}=${encodeURIComponent(debounced.trim())}`}
              className="font-medium text-info underline-offset-2 hover:underline"
            >
              Open in {tool.title} →
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
