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
import { base64ToBytes, bytesToBase64, utf8ToBytes } from '@/lib/bytes'
import {
  ecdsaSign,
  ecdsaVerify,
  exportKeyJwk,
  exportKeyPem,
  generateEcdsaKeyPair,
  type EcCurve,
} from '@/lib/asymmetric'
import type { Status } from '@/lib/types'
import { KeyDisplay } from './KeyDisplay'

const HASH_FOR_CURVE: Record<EcCurve, 'SHA-256' | 'SHA-384' | 'SHA-512'> = {
  'P-256': 'SHA-256',
  'P-384': 'SHA-384',
  'P-521': 'SHA-512',
}

export function EcdsaTool() {
  const tool = getToolById('ecdsa')!
  const [curve, setCurve] = useState<EcCurve>('P-256')
  const [keypair, setKeypair] = useState<CryptoKeyPair | null>(null)
  const [publicPem, setPublicPem] = useState('')
  const [privatePem, setPrivatePem] = useState('')
  const [publicJwk, setPublicJwk] = useState('')
  const [privateJwk, setPrivateJwk] = useState('')
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('CryptoCanvas signed message')
  const [signature, setSignature] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const generate = useCallback(async () => {
    setGenerating(true)
    try {
      const kp = await generateEcdsaKeyPair(curve)
      setKeypair(kp)
      const [pubPem, privPem, pubJwk, privJwk] = await Promise.all([
        exportKeyPem(kp.publicKey, 'public'),
        exportKeyPem(kp.privateKey, 'private'),
        exportKeyJwk(kp.publicKey),
        exportKeyJwk(kp.privateKey),
      ])
      setPublicPem(pubPem)
      setPrivatePem(privPem)
      setPublicJwk(pubJwk)
      setPrivateJwk(privJwk)
    } finally {
      setGenerating(false)
    }
  }, [curve])

  useEffect(() => {
    void generate()
  }, [generate])

  const onSign = async () => {
    if (!keypair) return
    try {
      const sig = await ecdsaSign(keypair.privateKey, utf8ToBytes(message), HASH_FOR_CURVE[curve])
      setSignature(bytesToBase64(sig))
      setStatus({ kind: 'success', message: 'Signed' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const onVerify = async () => {
    if (!keypair) return
    try {
      const ok = await ecdsaVerify(
        keypair.publicKey,
        base64ToBytes(signature),
        utf8ToBytes(message),
        HASH_FOR_CURVE[curve],
      )
      setStatus(
        ok
          ? { kind: 'success', message: 'Signature valid ✓' }
          : { kind: 'error', message: 'Signature invalid' },
      )
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <ToolShell
      tool={tool}
      explanation={
        <>
          <p>
            <strong>ECDSA</strong> = Elliptic Curve Digital Signature Algorithm. Same trust model
            as RSA-PSS — sign with the private key, verify with the public — but uses elliptic
            curves so keys are much shorter for the same security level (a 256-bit ECDSA key is
            roughly equivalent to a 3072-bit RSA key).
          </p>
          <p>
            ECDSA does <em>not</em> encrypt. For encryption with EC keys, look at ECDH-derived
            symmetric keys. ECDSA is everywhere — TLS, Bitcoin, JWTs.
          </p>
        </>
      }
    >
      <ToolPane
        title="Setup"
        contentClassName="grid gap-3 sm:grid-cols-2"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ec-curve">Curve</Label>
          <Select value={curve} onValueChange={(v) => setCurve(v as EcCurve)}>
            <SelectTrigger id="ec-curve">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P-256">P-256 (SHA-256)</SelectItem>
              <SelectItem value="P-384">P-384 (SHA-384)</SelectItem>
              <SelectItem value="P-521">P-521 (SHA-512)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>&nbsp;</Label>
          <Button onClick={generate} disabled={generating} variant="outline">
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            New keypair
          </Button>
        </div>
      </ToolPane>

      <KeyDisplay title="Public key" pem={publicPem} jwk={publicJwk} visibility="public" />
      <KeyDisplay title="Private key" pem={privatePem} jwk={privateJwk} visibility="private" />

      <ToolPane title="Message" actions={<StatusPulse status={status} />}>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="font-sans"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={onSign}>Sign with private key</Button>
        </div>
      </ToolPane>

      <ToolPane
        title="Signature (base64)"
        actions={signature ? <CopyButton text={signature} iconOnly /> : null}
      >
        <Textarea
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          rows={3}
          className="font-mono text-[12px]"
          placeholder="base64 signature"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={onVerify} variant="outline" disabled={!signature}>
            Verify with public key
          </Button>
        </div>
      </ToolPane>
    </ToolShell>
  )
}
