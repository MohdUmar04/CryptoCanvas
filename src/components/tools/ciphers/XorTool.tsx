import { useMemo, useState } from 'react'
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
import { xorBytes } from '@/lib/ciphers/xor'
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@/lib/bytes'

type Fmt = 'text' | 'hex'

const SHOW_BYTES = 28

function parseBytes(value: string, fmt: Fmt): Uint8Array {
  if (value === '') return new Uint8Array(0)
  return fmt === 'text' ? utf8ToBytes(value) : hexToBytes(value)
}

function formatBytes(bytes: Uint8Array, fmt: Fmt): string {
  if (bytes.length === 0) return ''
  return fmt === 'text' ? bytesToUtf8(bytes) : bytesToHex(bytes, ' ')
}

export function XorTool() {
  const tool = getToolById('xor')!
  const [input, setInput] = useState('Hello!')
  const [key, setKey] = useState('KEY')
  const [inputFmt, setInputFmt] = useState<Fmt>('text')
  const [keyFmt, setKeyFmt] = useState<Fmt>('text')
  const [outputFmt, setOutputFmt] = useState<Fmt>('hex')

  const { output, error, inputBytes, keyBytes, outputBytes } = useMemo(() => {
    try {
      const ib = parseBytes(input, inputFmt)
      const kb = parseBytes(key, keyFmt)
      if (ib.length === 0 || kb.length === 0) {
        return {
          output: '',
          error: null as string | null,
          inputBytes: ib,
          keyBytes: kb,
          outputBytes: new Uint8Array(0),
        }
      }
      const ob = xorBytes(ib, kb)
      return {
        output: formatBytes(ob, outputFmt),
        error: null,
        inputBytes: ib,
        keyBytes: kb,
        outputBytes: ob,
      }
    } catch (e) {
      return {
        output: '',
        error: e instanceof Error ? e.message : String(e),
        inputBytes: new Uint8Array(0),
        keyBytes: new Uint8Array(0),
        outputBytes: new Uint8Array(0),
      }
    }
  }, [input, key, inputFmt, keyFmt, outputFmt])

  return (
    <ToolShell
      tool={tool}
      explanation={
        <>
          <p>
            XOR (exclusive-or) flips each bit of the input where the key bit is set, and leaves it
            alone where the key bit is zero. Repeating the key for as long as the input gives a
            simple stream cipher: <code>plaintext ⊕ key = ciphertext</code>;{' '}
            <code>ciphertext ⊕ key = plaintext</code>.
          </p>
          <p>
            XOR with a short, repeating key is broken — it gives away patterns. XOR with a one-time
            pad of truly random bytes the same length as the message is mathematically unbreakable,
            but key distribution is the catch.
          </p>
        </>
      }
    >
      <ToolPane
        title="Formats"
        description="Choose how each field is read or written."
        contentClassName="grid gap-3 sm:grid-cols-3"
      >
        <FormatPicker label="Input" value={inputFmt} onChange={setInputFmt} idSuffix="in" />
        <FormatPicker label="Key" value={keyFmt} onChange={setKeyFmt} idSuffix="key" />
        <FormatPicker label="Output" value={outputFmt} onChange={setOutputFmt} idSuffix="out" />
      </ToolPane>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPane
          title={`Input (${inputFmt})`}
          actions={input ? <CopyButton text={input} iconOnly /> : null}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className={inputFmt === 'hex' ? 'font-mono' : 'font-sans'}
            placeholder={inputFmt === 'hex' ? '48 65 6c 6c 6f' : 'Hello!'}
          />
        </ToolPane>

        <ToolPane title={`Key (${keyFmt})`} actions={key ? <CopyButton text={key} iconOnly /> : null}>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className={keyFmt === 'hex' ? 'font-mono' : 'font-sans'}
            placeholder={keyFmt === 'hex' ? '4b 45 59' : 'KEY'}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Key bytes repeat as needed to cover the input.
          </p>
        </ToolPane>
      </div>

      <ToolPane
        title={`Output (${outputFmt})`}
        actions={output ? <CopyButton text={output} iconOnly /> : null}
      >
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="rounded-md border bg-background px-3 py-2 font-mono text-sm break-all min-h-[2.4rem]">
            {output || <span className="text-muted-foreground">…</span>}
          </div>
        )}
      </ToolPane>

      {inputBytes.length > 0 && keyBytes.length > 0 && !error && (
        <ToolPane
          title="Byte alignment"
          description={`First ${Math.min(SHOW_BYTES, inputBytes.length)} bytes`}
        >
          <ByteAlignment input={inputBytes} keyBytes={keyBytes} output={outputBytes} />
        </ToolPane>
      )}
    </ToolShell>
  )
}

function FormatPicker({
  label,
  value,
  onChange,
  idSuffix,
}: {
  label: string
  value: Fmt
  onChange: (v: Fmt) => void
  idSuffix: string
}) {
  const id = `xor-fmt-${idSuffix}`
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Fmt)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="text">Text (UTF-8)</SelectItem>
          <SelectItem value="hex">Hex bytes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function ByteAlignment({
  input,
  keyBytes,
  output,
}: {
  input: Uint8Array
  keyBytes: Uint8Array
  output: Uint8Array
}) {
  const cols = Math.min(SHOW_BYTES, input.length)
  return (
    <div className="overflow-x-auto">
      <table className="font-mono text-[11px]">
        <tbody>
          <ByteRow
            label="in"
            bytes={input}
            cols={cols}
            cellClass="border-border bg-card text-foreground"
          />
          <ByteRow
            label="key"
            bytes={keyBytes}
            cols={cols}
            cellClass="border-info/40 bg-info/10 text-info"
            wrap
          />
          <ByteRow
            label="xor"
            bytes={output}
            cols={cols}
            cellClass="border-success/40 bg-success/10 text-success"
          />
        </tbody>
      </table>
    </div>
  )
}

function ByteRow({
  label,
  bytes,
  cols,
  cellClass,
  wrap = false,
}: {
  label: string
  bytes: Uint8Array
  cols: number
  cellClass: string
  wrap?: boolean
}) {
  return (
    <tr>
      <td className="pr-2 text-muted-foreground">{label}</td>
      {Array.from({ length: cols }).map((_, i) => {
        const idx = wrap ? i % bytes.length : i
        const b = bytes[idx]
        return (
          <td
            key={i}
            className={`border ${cellClass} px-1.5 py-0.5 text-center`}
            style={{ minWidth: '1.7rem' }}
          >
            {b !== undefined ? b.toString(16).padStart(2, '0') : ''}
          </td>
        )
      })}
    </tr>
  )
}
