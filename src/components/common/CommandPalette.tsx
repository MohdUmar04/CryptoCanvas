import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { categories, tools, type Tool } from '@/data/tools'
import { cn } from '@/lib/utils'

/** Tiny subsequence fuzzy match — returns a score (lower is better) or -1. */
function fuzzyScore(query: string, target: string): number {
  if (query === '') return 0
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  let score = 0
  let lastMatch = -1
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (lastMatch >= 0) score += ti - lastMatch // reward adjacency
      lastMatch = ti
      qi++
    }
  }
  if (qi < q.length) return -1
  return score + lastMatch // reward earlier finish
}

function rankTools(query: string): Tool[] {
  if (query.trim() === '') return tools
  const scored: { tool: Tool; score: number }[] = []
  for (const tool of tools) {
    const haystacks = [tool.title, tool.id, tool.blurb, categories[tool.category].label]
    let best = -1
    for (const h of haystacks) {
      const s = fuzzyScore(query, h)
      if (s >= 0 && (best < 0 || s < best)) best = s
    }
    if (best >= 0) scored.push({ tool, score: best })
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.tool)
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => rankTools(query), [query])

  // Reset each time it opens.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  const go = (tool: Tool | undefined) => {
    if (!tool) return
    onOpenChange(false)
    navigate(tool.route)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[active])
    }
  }

  // Keep the active row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Search tools</DialogTitle>
        <DialogDescription className="sr-only">
          Type to filter, arrow keys to navigate, Enter to open.
        </DialogDescription>
        <div className="flex items-center gap-2 border-b px-3.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tools…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div ref={listRef} className="max-h-[min(24rem,60vh)] overflow-y-auto scrollbar-thin p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No tools match “{query}”.
            </p>
          ) : (
            results.map((tool, idx) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  type="button"
                  data-idx={idx}
                  onClick={() => go(tool)}
                  onMouseMove={() => setActive(idx)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left',
                    idx === active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-background text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{tool.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {tool.blurb}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {categories[tool.category].label}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
