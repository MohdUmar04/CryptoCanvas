import { ArrowDownUp } from 'lucide-react'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CopyButton } from '@/components/common/CopyButton'
import { FormatHint } from '@/components/common/FormatHint'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Textarea } from '@/components/ui/textarea'
import { useQueryState } from '@/hooks/useQueryState'
import type { Tool } from '@/data/tools'
import { cn } from '@/lib/utils'

type Props = {
  tool: Tool
  encode: (text: string) => string
  decode: (encoded: string) => string
  /** Bump this whenever options change so the active side is recomputed. */
  optionsKey?: string
  options?: React.ReactNode
  explanation?: React.ReactNode
  encodedLabel?: string
  decodedLabel?: string
  encodedPlaceholder?: string
  decodedPlaceholder?: string
  encodedClassName?: string
  decodedClassName?: string
  encodedRows?: number
  decodedRows?: number
}

function toMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export function EncoderTool({
  tool,
  encode,
  decode,
  optionsKey,
  options,
  explanation,
  encodedLabel = 'Encoded',
  decodedLabel = 'Plain text',
  encodedPlaceholder = '…',
  decodedPlaceholder = 'Type or paste text…',
  encodedClassName = 'font-mono',
  decodedClassName,
  encodedRows = 4,
  decodedRows = 4,
}: Props) {
  const [searchParams] = useSearchParams()
  const [text, setText] = useQueryState('in')
  const [encoded, setEncoded] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastEdited, setLastEdited] = useState<'text' | 'encoded'>('text')

  const encodeRef = useRef(encode)
  const decodeRef = useRef(decode)
  useEffect(() => {
    encodeRef.current = encode
    decodeRef.current = decode
  })

  // Seed both sides on mount from the URL: `in` = plain text, `enc` = encoded
  // value (used when another tool hands off via the format-hint banner).
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    const enc = searchParams.get('enc')
    const plain = searchParams.get('in')
    try {
      if (plain !== null && plain !== '') {
        setEncoded(encodeRef.current(plain))
      } else if (enc !== null && enc !== '') {
        setLastEdited('encoded')
        setEncoded(enc)
        setText(decodeRef.current(enc))
      }
      setError(null)
    } catch (e) {
      setError(toMessage(e))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTextChange = useCallback(
    (v: string) => {
      setLastEdited('text')
      setText(v)
      try {
        setEncoded(encodeRef.current(v))
        setError(null)
      } catch (e) {
        setError(toMessage(e))
      }
    },
    [setText],
  )

  const handleEncodedChange = useCallback(
    (v: string) => {
      setLastEdited('encoded')
      setEncoded(v)
      if (v.trim() === '') {
        setText('')
        setError(null)
        return
      }
      try {
        setText(decodeRef.current(v))
        setError(null)
      } catch (e) {
        setError(toMessage(e))
      }
    },
    [setText],
  )

  // When options change, recompute from whichever side was last edited
  useEffect(() => {
    if (lastEdited === 'text') {
      try {
        setEncoded(encodeRef.current(text))
        setError(null)
      } catch (e) {
        setError(toMessage(e))
      }
    } else {
      if (encoded.trim() === '') return
      try {
        setText(decodeRef.current(encoded))
        setError(null)
      } catch (e) {
        setError(toMessage(e))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey])

  return (
    <ToolShell tool={tool} explanation={explanation} shareable>
      {options && (
        <ToolPane title="Options" contentClassName="flex flex-wrap items-center gap-x-6 gap-y-3">
          {options}
        </ToolPane>
      )}

      <FormatHint value={text} exclude={tool.id} />

      <ToolPane
        title={decodedLabel}
        actions={text ? <CopyButton text={text} iconOnly /> : null}
      >
        <Textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={decodedPlaceholder}
          rows={decodedRows}
          className={cn('font-sans', decodedClassName)}
        />
      </ToolPane>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ArrowDownUp className="size-3.5" />
        live two-way conversion
      </div>

      <ToolPane
        title={encodedLabel}
        actions={encoded ? <CopyButton text={encoded} iconOnly /> : null}
      >
        <Textarea
          value={encoded}
          onChange={(e) => handleEncodedChange(e.target.value)}
          placeholder={encodedPlaceholder}
          rows={encodedRows}
          className={encodedClassName}
        />
        {error && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </ToolPane>
    </ToolShell>
  )
}
