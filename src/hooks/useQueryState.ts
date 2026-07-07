import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Two-way bind a string piece of state to a URL search param, so tool state is
 * shareable via the address bar. Writes are debounced and use replace (no
 * history spam). The initial URL value wins on mount; after that the component
 * owns the value.
 */
export function useQueryState(
  key: string,
  defaultValue = '',
  debounceMs = 300,
): [string, (v: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const [value, setValue] = useState(() => searchParams.get(key) ?? defaultValue)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const set = useCallback(
    (v: string) => {
      setValue(v)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            if (v === defaultValue || v === '') next.delete(key)
            else next.set(key, v)
            return next
          },
          { replace: true },
        )
      }, debounceMs)
    },
    [key, defaultValue, debounceMs, setSearchParams],
  )

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return [value, set]
}
