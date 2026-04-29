import { NavLink } from 'react-router-dom'
import { categories, categoryOrder, getToolsByCategory } from '@/data/tools'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-card transition-transform duration-200 ease-out lg:static lg:z-0 lg:w-64 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-6 pt-4 lg:pt-3">
          {categoryOrder.map((cat) => {
            const tools = getToolsByCategory(cat)
            if (tools.length === 0) return null
            return (
              <div key={cat} className="mb-5 last:mb-0">
                <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {categories[cat].label}
                </div>
                <ul className="flex flex-col gap-0.5">
                  {tools.map((tool) => {
                    const Icon = tool.icon
                    return (
                      <li key={tool.id}>
                        <NavLink
                          to={tool.route}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                              isActive && 'bg-accent font-medium text-accent-foreground',
                            )
                          }
                        >
                          <Icon className="size-4 shrink-0 text-primary group-hover:text-primary" />
                          <span className="truncate">{tool.title}</span>
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </aside>
    </>
  )
}
