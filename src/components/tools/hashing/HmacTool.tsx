import { useEffect, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getToolById } from '@/data/tools'
import { useDebounce } from '@/hooks/useDebounce'
import { bytesToBase64, bytesToHex, hexToBytes, utf8ToBytes } from '@/lib/bytes'
import { hmac, HMAC_ALGOS, type HmacAlgo } from '@/lib/hashing'

type KeyFormat = 'text' | 'hex'
type Encoding = 'hex' | 'base64'

export function HmacTool() {
  const tool = getToolById('hmac')!
  const [message, setMessage] = useState('The quick brown fox jumps over the lazy dog')
  const [key, setKey] = useState('key')
  const [keyFmt, setKeyFmt] = useState<KeyFormat>('text')
  const [algo, setAlgo] = useState<HmacAlgo>('HMAC-SHA-256')
  const [encoding, setEncoding] = useState<Encoding>('hex')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const debouncedMsg = useDebounce(message, 80)
  const debouncedKey = useDebounce(key, 80)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        if (debouncedKey === '') {
          if (!cancelled) {
            setOutput('')
            setError(null)
          }
          return
        }
        const keyBytes = keyFmt === 'text' ? utf8ToBytes(debouncedKey) : hexToBytes(debouncedKey)
        const dataBytes = utf8ToBytes(debouncedMsg)
        const sig = await hmac(algo, keyBytes, dataBytes)
        if (cancelled) return
        setOutput(encoding === 'hex' ? bytesToHex(sig) : bytesToBase64(sig))
        setError(null)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
        setOutput('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedMsg, debouncedKey, keyFmt, algo, encoding])

  return (
    <ToolShell
      tool={tool}
      explanation={
        <>
          <p>
            HMAC pairs a hash with a secret key. <code>HMAC(key, msg)</code> proves to anyone with
            the key that the message was authored by someone who held the key — and that the
            message hasn't been tampered with.
          </p>
          <p>
            HMAC is the standard way to attach a "tag" to a payload (e.g. cookies, API requests).
            Verifying = recomputing the HMAC with the same key and comparing in constant time.
          </p>
        </>
      }
    >
      <ToolPane
        title="Options"
        contentClassName="grid gap-3 sm:grid-cols-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hmac-algo">Algorithm</Label>
          <Select value={algo} onValueChange={(v) => setAlgo(v as HmacAlgo)}>
            <SelectTrigger id="hmac-algo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HMAC_ALGOS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hmac-keyfmt">Key format</Label>
          <Select value={keyFmt} onValueChange={(v) => setKeyFmt(v as KeyFormat)}>
            <SelectTrigger id="hmac-keyfmt">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text (UTF-8)</SelectItem>
              <SelectItem value="hex">Hex bytes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hmac-encoding">Output encoding</Label>
          <Select value={encoding} onValueChange={(v) => setEncoding(v as Encoding)}>
            <SelectTrigger id="hmac-encoding">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hex">Hex</SelectItem>
              <SelectItem value="base64">Base64</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ToolPane>

      <ToolPane title="Message">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="font-sans"
        />
      </ToolPane>

      <ToolPane title={`Key (${keyFmt})`}>
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={keyFmt === 'hex' ? '6b 65 79' : 'your secret key'}
          className={keyFmt === 'hex' ? 'font-mono' : 'font-sans'}
        />
      </ToolPane>

      <ToolPane
        title={`MAC (${encoding})`}
        actions={output ? <CopyButton text={output} iconOnly /> : null}
      >
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="rounded-md border bg-background px-3 py-2 font-mono text-[12px] break-all min-h-[2.4rem]">
            {output || <span className="text-muted-foreground">…</span>}
          </div>
        )}
      </ToolPane>
    </ToolShell>
  )
}
