import { Dice5, Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { StatusPulse } from '@/components/common/StatusPulse'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getToolById } from '@/data/tools'
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@/lib/bytes'
import {
  aesDecrypt,
  aesEncrypt,
  generateAesKey,
  generateIv,
  ivLengthFor,
  type AesMode,
  type KeySizeBits,
} from '@/lib/symmetric'
import type { Status } from '@/lib/types'
import { AesRoundVisualizer } from './AesRoundVisualizer'
import { TamperPanel } from './TamperPanel'

export function AesTool() {
  const tool = getToolById('aes')!
  const [mode, setMode] = useState<AesMode>('AES-GCM')
  const [keyBits, setKeyBits] = useState<KeySizeBits>(256)
  const [op, setOp] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [keyHex, setKeyHex] = useState('')
  const [ivHex, setIvHex] = useState('')
  const [aad, setAad] = useState('')
  const [plaintext, setPlaintext] = useState('Hello, CryptoCanvas!')
  const [ciphertextHex, setCiphertextHex] = useState('')
  const [tagHex, setTagHex] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [showVisualizer, setShowVisualizer] = useState(false)

  // Seed initial random key + iv on first mount, and re-roll if mode/keysize changes
  useEffect(() => {
    setKeyHex(bytesToHex(generateAesKey(keyBits)))
  }, [keyBits])
  useEffect(() => {
    setIvHex(bytesToHex(generateIv(mode)))
    if (mode !== 'AES-GCM') setTagHex('')
  }, [mode])

  const rollKey = () => setKeyHex(bytesToHex(generateAesKey(keyBits)))
  const rollIv = () => setIvHex(bytesToHex(generateIv(mode)))

  const handleEncrypt = async () => {
    try {
      const key = hexToBytes(keyHex)
      const iv = hexToBytes(ivHex)
      const data = utf8ToBytes(plaintext)
      const aadBytes = aad ? utf8ToBytes(aad) : undefined
      const result = await aesEncrypt({ mode, key, iv, plaintext: data, aad: aadBytes })
      setCiphertextHex(bytesToHex(result.ciphertext))
      setTagHex(result.tag ? bytesToHex(result.tag) : '')
      setStatus({ kind: 'success', message: 'Encrypted' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleDecrypt = async () => {
    try {
      const key = hexToBytes(keyHex)
      const iv = hexToBytes(ivHex)
      const ct = hexToBytes(ciphertextHex)
      const tag = mode === 'AES-GCM' ? hexToBytes(tagHex) : undefined
      const aadBytes = aad ? utf8ToBytes(aad) : undefined
      const out = await aesDecrypt({ mode, key, iv, ciphertext: ct, tag, aad: aadBytes })
      setPlaintext(bytesToUtf8(out))
      setStatus({ kind: 'success', message: 'Decrypted ✓' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const ivLabel = mode === 'AES-GCM' ? 'Nonce (12 bytes)' : 'IV (16 bytes)'

  return (
    <ToolShell
      tool={tool}
      headerExtras={<StatusPulse status={status} />}
      explanation={
        <>
          <p>
            <strong>AES</strong> is the modern symmetric block cipher: same key encrypts and
            decrypts. <strong>AES-GCM</strong> is authenticated encryption — it produces both a
            ciphertext and a 16-byte tag that proves the ciphertext was created with the same key
            and not modified.
          </p>
          <p>
            <strong>AES-CBC</strong> is older and unauthenticated — encryption alone, no tamper
            detection. Always pair CBC with HMAC, or just use GCM.
          </p>
          <p>
            <strong>The IV must be unique per message under the same key.</strong> For GCM, reusing
            a nonce is catastrophic. Roll a fresh one for each encryption.
          </p>
        </>
      }
    >
      <ToolPane
        title="Setup"
        contentClassName="grid gap-3 md:grid-cols-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="aes-mode">Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as AesMode)}>
            <SelectTrigger id="aes-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AES-GCM">AES-GCM (authenticated)</SelectItem>
              <SelectItem value="AES-CBC">AES-CBC (unauthenticated)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="aes-keysize">Key size</Label>
          <Select
            value={String(keyBits)}
            onValueChange={(v) => setKeyBits(Number(v) as KeySizeBits)}
          >
            <SelectTrigger id="aes-keysize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="128">AES-128</SelectItem>
              <SelectItem value="192">AES-192</SelectItem>
              <SelectItem value="256">AES-256</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Operation</Label>
          <Tabs value={op} onValueChange={(v) => setOp(v as 'encrypt' | 'decrypt')}>
            <TabsList>
              <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
              <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </ToolPane>

      <ToolPane
        title={`Key (${keyBits / 8} bytes)`}
        actions={
          <Button onClick={rollKey} variant="outline" size="sm">
            <Dice5 className="size-3.5" /> Random
          </Button>
        }
      >
        <Input
          value={keyHex}
          onChange={(e) => setKeyHex(e.target.value.replace(/[^0-9a-fA-F\s]/g, ''))}
          className="font-mono text-[12px]"
          placeholder="hex bytes"
        />
        {keyHex && (
          <div className="mt-2 flex items-center gap-2">
            <CopyButton text={keyHex} label="Copy key" />
          </div>
        )}
      </ToolPane>

      <ToolPane
        title={ivLabel}
        actions={
          <Button onClick={rollIv} variant="outline" size="sm">
            <Dice5 className="size-3.5" /> Random
          </Button>
        }
      >
        <Input
          value={ivHex}
          onChange={(e) => setIvHex(e.target.value.replace(/[^0-9a-fA-F\s]/g, ''))}
          className="font-mono text-[12px]"
          placeholder={`hex (${ivLengthFor(mode)} bytes)`}
        />
        {ivHex && (
          <div className="mt-2 flex items-center gap-2">
            <CopyButton text={ivHex} label="Copy IV" />
          </div>
        )}
      </ToolPane>

      {mode === 'AES-GCM' && (
        <ToolPane
          title="Additional authenticated data (optional)"
          description="Bound to the tag, but not encrypted. Both sides must use the same AAD."
        >
          <Input
            value={aad}
            onChange={(e) => setAad(e.target.value)}
            placeholder="metadata, version, recipient id, …"
          />
        </ToolPane>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowVisualizer((v) => !v)}>
          {showVisualizer ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {showVisualizer ? 'Hide' : 'Show'} round-by-round
        </Button>
      </div>
      {showVisualizer && (
        <AesRoundVisualizer keyHex={keyHex} keyBits={keyBits} plaintext={plaintext} />
      )}

      {op === 'encrypt' ? (
        <>
          <ToolPane title="Plaintext">
            <Textarea
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              rows={4}
              className="font-sans"
            />
          </ToolPane>
          <div className="flex justify-end">
            <Button onClick={handleEncrypt} disabled={!keyHex || !ivHex}>
              Encrypt
            </Button>
          </div>
          <ToolPane
            title="Ciphertext (hex)"
            actions={ciphertextHex ? <CopyButton text={ciphertextHex} iconOnly /> : null}
          >
            <div className="rounded-md border bg-background px-3 py-2 font-mono text-[12px] break-all min-h-[2.4rem]">
              {ciphertextHex || <span className="text-muted-foreground">…</span>}
            </div>
          </ToolPane>
          {mode === 'AES-GCM' && (
            <ToolPane
              title="Auth tag (hex, 16 bytes)"
              actions={tagHex ? <CopyButton text={tagHex} iconOnly /> : null}
            >
              <div className="rounded-md border bg-background px-3 py-2 font-mono text-[12px] break-all min-h-[2.4rem]">
                {tagHex || <span className="text-muted-foreground">…</span>}
              </div>
            </ToolPane>
          )}
          {ciphertextHex && (mode !== 'AES-GCM' || tagHex) && (
            <TamperPanel
              mode={mode}
              keyHex={keyHex}
              ivHex={ivHex}
              ciphertextHex={ciphertextHex}
              tagHex={tagHex}
              aad={aad}
            />
          )}
        </>
      ) : (
        <>
          <ToolPane title="Ciphertext (hex)">
            <Textarea
              value={ciphertextHex}
              onChange={(e) => setCiphertextHex(e.target.value)}
              rows={3}
              className="font-mono text-[12px]"
              placeholder="hex bytes"
            />
          </ToolPane>
          {mode === 'AES-GCM' && (
            <ToolPane title="Auth tag (hex, 16 bytes)">
              <Input
                value={tagHex}
                onChange={(e) => setTagHex(e.target.value)}
                className="font-mono text-[12px]"
                placeholder="hex bytes"
              />
            </ToolPane>
          )}
          <div className="flex justify-end">
            <Button onClick={handleDecrypt} disabled={!keyHex || !ivHex || !ciphertextHex}>
              Decrypt
            </Button>
          </div>
          <ToolPane
            title="Plaintext"
            actions={plaintext ? <CopyButton text={plaintext} iconOnly /> : null}
          >
            <div className="rounded-md border bg-background px-3 py-2 font-mono text-sm break-all min-h-[2.4rem] whitespace-pre-wrap">
              {plaintext || <span className="text-muted-foreground">…</span>}
            </div>
          </ToolPane>
        </>
      )}
    </ToolShell>
  )
}
