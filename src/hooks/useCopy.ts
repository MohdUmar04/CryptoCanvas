import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

export function useCopy(timeout = 1500) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = useCallback(
    async (text: string, label = 'Copied') => {
      try {
        if (!text) return false
        await navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success(label)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), timeout)
        return true
      } catch (err) {
        toast.error('Copy failed')
        console.error(err)
        return false
      }
    },
    [timeout],
  )

  return { copy, copied }
}
