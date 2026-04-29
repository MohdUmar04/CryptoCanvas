import { Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { JsonEditor } from '@/components/common/JsonEditor'
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
import { utf8ToBytes } from '@/lib/bytes'
import {
  decodeJwtParts,
  generateAlgKeyPair,
  HMAC_ALGS,
  signJwtToken,
  verifyJwtToken,
  type AnyKey,
  type JwtAlg,
  type Pair,
} from '@/lib/tokens'
import type { Status } from '@/lib/types'
import { ColoredToken } from './ColoredToken'

const ALGS: JwtAlg[] = ['HS256', 'HS384', 'HS512', 'RS256', 'PS256', 'ES256']

export function JwtTool() {
  const tool = getToolById('jwt')!
  const [alg, setAlg] = useState<JwtAlg>('HS256')
  const [headerJson, setHeaderJson] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
  const [payloadJson, setPayloadJson] = useState(
    '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "iat": 1729000000\n}',
  )
  const [secret, setSecret] = useState('your-256-bit-secret')
  const [keypair, setKeypair] = useState<Pair | null>(null)
  const [generating, setGenerating] = useState(false)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const isHmac = HMAC_ALGS.has(alg)

  // Sync header.alg with selected algorithm
  useEffect(() => {
    try {
      const parsed = JSON.parse(headerJson)
      if (parsed.alg !== alg) {
        parsed.alg = alg
        setHeaderJson(JSON.stringify(parsed, null, 2))
      }
    } catch {
      // leave the header alone if it isn't valid JSON yet
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alg])

  const generate = useCallback(async () => {
    if (isHmac) {
      setKeypair(null)
      return
    }
    setGenerating(true)
    try {
      const kp = await generateAlgKeyPair(alg as Exclude<JwtAlg, 'HS256' | 'HS384' | 'HS512'>)
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
      const header = JSON.parse(headerJson)
      const payload = JSON.parse(payloadJson)
      const key: AnyKey = isHmac ? utf8ToBytes(secret) : keypair!.privateKey
      const t = await signJwtToken({ header, payload, key })
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
      await verifyJwtToken(token, key)
      setStatus({ kind: 'success', message: 'Signature valid ✓' })
    } catch {
      setStatus({ kind: 'error', message: 'Verification failed' })
    }
  }

  const decoded = useMemo(() => decodeJwtParts(token), [token])

  return (
    <ToolShell
      tool={tool}
      headerExtras={<StatusPulse status={status} />}
      explanation={
        <>
          <p>
            A <strong>JWT</strong> is, technically, a <strong>JWS</strong> whose payload is a JSON
            object of <em>claims</em> (<code>sub</code>, <code>iss</code>, <code>exp</code>, …).
            Same wire format — three Base64URL parts joined by dots:{' '}
            <span className="text-jwt-header">header</span>.
            <span className="text-jwt-payload">payload</span>.
            <span className="text-jwt-signature">signature</span> — but JWT adds the rule that the
            payload must be JSON.
          </p>
          <p>
            <strong>HS256/384/512</strong> are HMAC: a single <em>shared secret</em> both signs and
            verifies. Use this when one party controls both ends (issuer and verifier are you).
            Anyone holding the secret can mint valid tokens, so leak it carefully.
          </p>
          <p>
            <strong>RS*</strong> (RSA-PKCS#1), <strong>PS*</strong> (RSA-PSS), and{' '}
            <strong>ES*</strong> (ECDSA) use asymmetric keypairs: <em>sign with the private</em>{' '}
            key, <em>verify with the public</em> key. Right when many services need to verify but
            only one issues.
          </p>
          <p>
            JWT <em>does not encrypt</em>. The payload is base64-encoded, not hidden — never put a
            password in there. For confidentiality, look at JWE or the Nested JWT tool.
          </p>
        </>
      }
    >
      <ToolPane
        title="Algorithm"
        contentClassName="flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="jwt-alg">Algorithm</Label>
          <Select value={alg} onValueChange={(v) => setAlg(v as JwtAlg)}>
            <SelectTrigger id="jwt-alg" className="w-32">
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

      <ToolPane title="Header" description="Marks the algorithm and token type.">
        <JsonEditor value={headerJson} onChange={setHeaderJson} height="120px" />
      </ToolPane>

      <ToolPane title="Payload" description="Claims about the subject — not encrypted.">
        <JsonEditor value={payloadJson} onChange={setPayloadJson} height="200px" />
      </ToolPane>

      {isHmac ? (
        <ToolPane title="Shared secret">
          <Input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="font-mono"
            placeholder="shared HMAC secret"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Anyone with this secret can both sign and verify.
          </p>
        </ToolPane>
      ) : (
        <ToolPane title="Keypair">
          <p className="text-sm text-muted-foreground">
            {generating
              ? 'Generating fresh keypair…'
              : keypair
                ? 'Generated. Sign uses the private key; verify uses the public key.'
                : 'No keypair yet.'}
          </p>
        </ToolPane>
      )}

      <div className="flex justify-end">
        <Button onClick={onSign} disabled={!isHmac && !keypair}>
          Sign JWT
        </Button>
      </div>

      <ToolPane
        title="Token"
        description="header . payload . signature"
        actions={token ? <CopyButton text={token} iconOnly /> : null}
      >
        <Textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={3}
          className="font-mono text-[12px]"
          placeholder="…"
        />
        {token && <ColoredToken token={token} className="mt-3" />}
        <div className="mt-3 flex justify-end">
          <Button onClick={onVerify} variant="outline" disabled={!token}>
            Verify
          </Button>
        </div>
      </ToolPane>

      {token && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ToolPane title="Decoded header">
            <pre className="overflow-auto rounded-md border bg-background p-3 font-mono text-[12px] leading-relaxed">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </ToolPane>
          <ToolPane title="Decoded payload">
            <pre className="overflow-auto rounded-md border bg-background p-3 font-mono text-[12px] leading-relaxed">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </ToolPane>
        </div>
      )}
    </ToolShell>
  )
}
