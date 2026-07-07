import * as React from 'react'
import { cn } from '@/lib/utils'

type Props = Omit<React.ComponentProps<'section'>, 'title'> & {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  contentClassName?: string
}

export function ToolPane({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  ...props
}: Props) {
  return (
    <section className={cn('rounded-xl border bg-card', className)} {...props}>
      {(title || actions || description) && (
        <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold">{title}</h2>}
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={cn('p-4', contentClassName)}>{children}</div>
    </section>
  )
}
