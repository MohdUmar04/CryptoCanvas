import { Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { StatusPulse } from '@/components/common/StatusPulse'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Button } from '@/components/ui/button'
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
import { bytesToUtf8, utf8ToBytes } from '@/lib/bytes'
import {
  decryptJwe,
  encryptJwe,
  generateJweKeyPair,
  type JweEncAlg,
  type JweKeyAlg,
  type Pair,
} from '@/lib/tokens'
import type { Status } from '@/lib/types'
import { ColoredToken } from './ColoredToken'

export function JweTool() {
  const tool = getToolById('jwe')!
  const [keyAlg, setKeyAlg] = useState<JweKeyAlg>('RSA-OAEP-256')
  const [encAlg, setEncAlg] = useState<JweEncAlg>('A256GCM')
  const [keypair, setKeypair] = useState<Pair | null>(null)
  const [generating, setGenerating] = useState(false)
  const [plaintext, setPlaintext] = useState(
    JSON.stringify({ message: 'top secret', issued: 'now' }, null, 2),
  )
  const [token, setToken] = useState('')
  const [decrypted, setDecrypted] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const generate = useCallback(async () => {
    setGenerating(true)
    try {
      const kp = await generateJweKeyPair(keyAlg)
      setKeypair(kp)
    } finally {
      setGenerating(false)
    }
  }, [keyAlg])

  useEffect(() => {
    void generate()
  }, [generate])

  const onEncrypt = async () => {
    if (!keypair) return
    try {
      const t = await encryptJwe({
        plaintext: utf8ToBytes(plaintext),
        publicKey: keypair.publicKey,
        keyAlg,
        encAlg,
      })
      setToken(t)
      setStatus({ kind: 'success', message: 'Encrypted' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const onDecrypt = async () => {
    if (!keypair || !token) return
    try {
      const { plaintext: p } = await decryptJwe(token, keypair.privateKey)
      setDecrypted(bytesToUtf8(p))
      setStatus({ kind: 'success', message: 'Decrypted ✓' })
    } catch {
      setDecrypted('')
      setStatus({ kind: 'error', message: 'Decryption failed' })
    }
  }

  return (
    <ToolShell
      tool={tool}
      headerExtras={<StatusPulse status={status} />}
      explanation={
        <>
          <p>
            <strong>JWE</strong> (JSON Web Encryption) is the confidentiality cousin of JWS. Where
            JWS only authenticates, JWE actually encrypts the payload so it can be opened by the
            holder of the corresponding key.
          </p>
          <p>
            Compact JWE has five dot-separated parts:{' '}
            <span className="text-jwt-header">header</span>.
            <span className="text-jwt-payload">encryptedKey</span>.
            <span className="text-warning">iv</span>.
            <span className="text-jwt-payload">ciphertext</span>.
            <span className="text-jwt-signature">tag</span>. We use{' '}
            <code>{keyAlg}</code> to wrap a fresh content-encryption key and{' '}
            <code>{encAlg}</code> for the actual content encryption.
          </p>
        </>
      }
    >
      <ToolPane
        title="Setup"
        contentClassName="flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="jwe-keyalg">Key wrap</Label>
          <Select value={keyAlg} onValueChange={(v) => setKeyAlg(v as JweKeyAlg)}>
            <SelectTrigger id="jwe-keyalg" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RSA-OAEP">RSA-OAEP</SelectItem>
              <SelectItem value="RSA-OAEP-256">RSA-OAEP-256</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="jwe-enc">Content encryption</Label>
          <Select value={encAlg} onValueChange={(v) => setEncAlg(v as JweEncAlg)}>
            <SelectTrigger id="jwe-enc" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A128GCM">A128GCM</SelectItem>
              <SelectItem value="A256GCM">A256GCM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={generate}
          disabled={generating}
          variant="outline"
          size="sm"
          className="mt-5"
        >
          {generating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          New RSA keypair
        </Button>
      </ToolPane>

      <ToolPane title="Plaintext">
        <Textarea
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          rows={4}
          className="font-mono text-[13px]"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={onEncrypt} disabled={!keypair}>
            Encrypt
          </Button>
        </div>
      </ToolPane>

      <ToolPane
        title="Compact JWE"
        actions={token ? <CopyButton text={token} iconOnly /> : null}
      >
        <Textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={4}
          className="font-mono text-[12px]"
        />
        {token && <ColoredToken token={token} partsCount={5} className="mt-3" />}
        <div className="mt-3 flex justify-end">
          <Button onClick={onDecrypt} variant="outline" disabled={!token}>
            Decrypt
          </Button>
        </div>
      </ToolPane>

      {decrypted && (
        <ToolPane title="Decrypted plaintext">
          <pre className="rounded-md border bg-background p-3 font-mono text-sm whitespace-pre-wrap break-all">
            {decrypted}
          </pre>
        </ToolPane>
      )}
    </ToolShell>
  )
}
