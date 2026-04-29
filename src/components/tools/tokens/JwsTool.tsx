import { Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { getToolById } from '@/data/tools'
import { bytesToUtf8, utf8ToBytes } from '@/lib/bytes'
import {
  generateAlgKeyPair,
  HMAC_ALGS,
  signJws,
  verifyJwsToken,
  type AnyKey,
  type JwsAlg,
  type Pair,
} from '@/lib/tokens'
import type { Status } from '@/lib/types'
import { ColoredToken } from './ColoredToken'

const ALGS: JwsAlg[] = ['HS256', 'HS384', 'HS512', 'RS256', 'PS256', 'ES256']

export function JwsTool() {
  const tool = getToolById('jws')!
  const [alg, setAlg] = useState<JwsAlg>('HS256')
  const [secret, setSecret] = useState('your-jws-secret')
  const [keypair, setKeypair] = useState<Pair | null>(null)
  const [generating, setGenerating] = useState(false)
  const [payload, setPayload] = useState('Arbitrary signed bytes — no JSON required.')
  const [token, setToken] = useState('')
  const [verified, setVerified] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const isHmac = HMAC_ALGS.has(alg)

  const generate = useCallback(async () => {
    if (isHmac) {
      setKeypair(null)
      return
    }
    setGenerating(true)
    try {
      const kp = await generateAlgKeyPair(alg as Exclude<JwsAlg, 'HS256' | 'HS384' | 'HS512'>)
      setKeypair(kp)
    } finally {
      setGenerating(false)
    }
  }, [alg, isHmac])

  useEffect(() => {
    void generate()
  }, [generate])

  const onSign = async () => {
    try {
      const key: AnyKey = isHmac ? utf8ToBytes(secret) : keypair!.privateKey
      const t = await signJws({
        header: { alg },
        payload: utf8ToBytes(payload),
        key,
      })
      setToken(t)
      setStatus({ kind: 'success', message: 'Signed' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const onVerify = async () => {
    if (!token) return
    try {
      const key: AnyKey = isHmac ? utf8ToBytes(secret) : keypair!.publicKey
      const { payload: p } = await verifyJwsToken(token, key)
      setVerified(bytesToUtf8(p))
      setStatus({ kind: 'success', message: 'Signature valid ✓' })
    } catch {
      setVerified('')
      setStatus({ kind: 'error', message: 'Verification failed' })
    }
  }

  return (
    <ToolShell
      tool={tool}
      headerExtras={<StatusPulse status={status} />}
      explanation={
        <>
          <p>
            <strong>JWS</strong> (JSON Web Signature, RFC 7515) is the lower-level signing
            primitive that JWT is built on. Same three dot-separated parts —{' '}
            <span className="text-jwt-header">header</span>.
            <span className="text-jwt-payload">payload</span>.
            <span className="text-jwt-signature">signature</span> — but the payload is{' '}
            <em>arbitrary bytes</em>, not necessarily JSON.
          </p>
          <p>
            Rule of thumb: <strong>every JWT is a JWS</strong>; not every JWS is a JWT. Use plain
            JWS when you want to sign something that isn't a set of JWT-style claims (CBOR, a
            protobuf, a file digest, …).
          </p>
          <p>
            Algorithms work exactly like JWT: <code>HS*</code> share a secret; <code>RS*</code>,{' '}
            <code>PS*</code>, and <code>ES*</code> use a private key to sign and a public key to
            verify.
          </p>
        </>
      }
    >
      <ToolPane
        title="Algorithm"
        contentClassName="flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="jws-alg">Algorithm</Label>
          <Select value={alg} onValueChange={(v) => setAlg(v as JwsAlg)}>
            <SelectTrigger id="jws-alg" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALGS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!isHmac && (
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
            New keypair
          </Button>
        )}
      </ToolPane>

      {isHmac && (
        <ToolPane title="Shared secret">
          <Input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="font-mono"
          />
        </ToolPane>
      )}

      <ToolPane title="Payload">
        <Textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={3}
          className="font-sans"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={onSign} disabled={!isHmac && !keypair}>
            Sign
          </Button>
        </div>
      </ToolPane>

      <ToolPane
        title="Compact JWS"
        actions={token ? <CopyButton text={token} iconOnly /> : null}
      >
        <Textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={3}
          className="font-mono text-[12px]"
        />
        {token && <ColoredToken token={token} className="mt-3" />}
        <div className="mt-3 flex justify-end">
          <Button onClick={onVerify} variant="outline" disabled={!token}>
            Verify
          </Button>
        </div>
      </ToolPane>

      {verified && (
        <ToolPane title="Verified payload">
          <pre className="rounded-md border bg-background p-3 font-mono text-sm whitespace-pre-wrap break-all">
            {verified}
          </pre>
        </ToolPane>
      )}
    </ToolShell>
  )
}
