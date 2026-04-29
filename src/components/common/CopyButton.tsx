import { Check, Copy } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useCopy } from '@/hooks/useCopy'
import { cn } from '@/lib/utils'

type Props = Omit<ButtonProps, 'children' | 'onClick'> & {
  text: string | (() => string)
  label?: string
  successLabel?: string
  iconOnly?: boolean
}

export function CopyButton({
  text,
  label = 'Copy',
  successLabel = 'Copied',
  iconOnly = false,
  className,
  size = iconOnly ? 'icon-sm' : 'sm',
  variant = 'outline',
  ...props
}: Props) {
  const { copy, copied } = useCopy()
  const onClick = () => {
    const value = typeof text === 'function' ? text() : text
    if (!value) return
    void copy(value, successLabel)
  }
  const Icon = copied ? Check : Copy
  return (
    <Button
      type="button"
      onClick={onClick}
      size={size}
      variant={variant}
      className={cn('gap-1.5', className)}
      aria-label={iconOnly ? (copied ? successLabel : label) : undefined}
      {...props}
    >
      <Icon className={cn('size-3.5', copied && 'text-success')} />
      {!iconOnly && <span>{copied ? successLabel : label}</span>}
    </Button>
  )
}
