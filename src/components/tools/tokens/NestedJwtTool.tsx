import { ArrowDown, Loader2, RefreshCw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  decryptThenVerifyJwt,
  generateAlgKeyPair,
  generateJweKeyPair,
  HMAC_ALGS,
  signThenEncryptJwt,
  type AnyKey,
  type JweEncAlg,
  type JweKeyAlg,
  type JwtAlg,
  type Pair,
} from '@/lib/tokens'
import type { Status } from '@/lib/types'
import { ColoredToken } from './ColoredToken'

const SIGN_ALGS: JwtAlg[] = ['HS256', 'RS256', 'PS256', 'ES256']

export function NestedJwtTool() {
  const tool = getToolById('nested')!

  // Inner-signature settings
  const [signAlg, setSignAlg] = useState<JwtAlg>('RS256')
  const [hmacSecret, setHmacSecret] = useState('shared-secret-for-tests')
  const [signKp, setSignKp] = useState<Pair | null>(null)

  // Outer-encryption settings (always RSA-OAEP)
  const [keyAlg, setKeyAlg] = useState<JweKeyAlg>('RSA-OAEP-256')
  const [encAlg, setEncAlg] = useState<JweEncAlg>('A256GCM')
  const [encKp, setEncKp] = useState<Pair | null>(null)

  const [generating, setGenerating] = useState(false)

  const [headerJson, setHeaderJson] = useState('{\n  "alg": "RS256",\n  "typ": "JWT"\n}')
  const [payloadJson, setPayloadJson] = useState(
    '{\n  "sub": "alice",\n  "msg": "top secret",\n  "iat": 1729000000\n}',
  )

  const [innerJws, setInnerJws] = useState('')
  const [outerJwe, setOuterJwe] = useState('')
  const [buildStatus, setBuildStatus] = useState<Status>({ kind: 'idle' })
  // 'idle' before first build; 'signing' renders only the inner JWS;
  // 'encrypting' adds the outer JWE with the ciphertext slot dropping in;
  // 'done' is the settled state.
  const [buildPhase, setBuildPhase] = useState<'idle' | 'signing' | 'encrypting' | 'done'>('idle')
  // Bumped on each Build click so the colored-token animations re-trigger.
  // A ref tracks the current run for async cancellation; state mirrors it for the React key.
  const buildRunRef = useRef(0)
  const [buildRun, setBuildRun] = useState(0)

  const [verifyToken, setVerifyToken] = useState('')
  const [decryptedInner, setDecryptedInner] = useState('')
  const [verifiedClaims, setVerifiedClaims] = useState<unknown>(null)
  const [verifyStatus, setVerifyStatus] = useState<Status>({ kind: 'idle' })

  const isHmacInner = HMAC_ALGS.has(signAlg)

  // Sync header.alg with the chosen sign algorithm
  useEffect(() => {
    try {
      const parsed = JSON.parse(headerJson)
      if (parsed.alg !== signAlg) {
        parsed.alg = signAlg
        setHeaderJson(JSON.stringify(parsed, null, 2))
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signAlg])

  // (Re-)generate keypairs when algorithms change
  const generate = useCallback(async () => {
    setGenerating(true)
    try {
      const [s, e] = await Promise.all([
        isHmacInner
          ? Promise.resolve(null)
          : generateAlgKeyPair(signAlg as Exclude<JwtAlg, 'HS256' | 'HS384' | 'HS512'>),
        generateJweKeyPair(keyAlg),
      ])
      setSignKp(s)
      setEncKp(e)
    } finally {
      setGenerating(false)
    }
  }, [signAlg, keyAlg, isHmacInner])

  useEffect(() => {
    void generate()
  }, [generate])

  const onBuild = async () => {
    buildRunRef.current += 1
    const myRun = buildRunRef.current
    setBuildRun(myRun)
    setInnerJws('')
    setOuterJwe('')
    setBuildPhase('signing')
    setBuildStatus({ kind: 'idle' })
    try {
      if (!encKp) throw new Error('Encryption keypair not ready yet.')
      const header = JSON.parse(headerJson)
      const payload = JSON.parse(payloadJson)
      const signKey: AnyKey = isHmacInner ? utf8ToBytes(hmacSecret) : signKp!.privateKey
      const result = await signThenEncryptJwt({
        signHeader: header,
        payload,
        signKey,
        encryptionPublicKey: encKp.publicKey,
        keyAlg,
        encAlg,
      })
      if (buildRunRef.current !== myRun) return
      setInnerJws(result.inner)
      // give the inner-JWS stagger time to play before the outer arrives
      await new Promise((r) => setTimeout(r, 700))
      if (buildRunRef.current !== myRun) return
      setBuildPhase('encrypting')
      setOuterJwe(result.outer)
      setVerifyToken(result.outer)
      // let the outer 5-part stagger finish before clearing the highlight
      await new Promise((r) => setTimeout(r, 900))
      if (buildRunRef.current !== myRun) return
      setBuildPhase('done')
      setBuildStatus({ kind: 'success', message: 'Signed → Encrypted' })
    } catch (e) {
      setBuildPhase('done')
      setBuildStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const onDecryptVerify = async () => {
    try {
      if (!encKp) throw new Error('Encryption keypair not ready.')
      const verifyKey: AnyKey = isHmacInner ? utf8ToBytes(hmacSecret) : signKp!.publicKey
      const r = await decryptThenVerifyJwt({
        token: verifyToken,
        decryptionPrivateKey: encKp.privateKey,
        verifyKey,
      })
      setDecryptedInner(r.innerJwt)
      setVerifiedClaims(r.payload)
      setVerifyStatus({ kind: 'success', message: 'Decrypted ✓ — Signature valid ✓' })
    } catch (e) {
      setDecryptedInner('')
      setVerifiedClaims(null)
      setVerifyStatus({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Verification failed',
      })
    }
  }

  return (
    <ToolShell
      tool={tool}
      headerExtras={<StatusPulse status={buildStatus} />}
      explanation={
        <>
          <p>
            A <strong>nested JWT</strong> is the standard "sign then encrypt" pattern — RFC 7519
            §11.2. You sign your JSON claims as a JWS (3 parts), then drop that whole token into a
            JWE (5 parts) as its plaintext payload. The outer JWE's header carries{' '}
            <code>cty: "JWT"</code> to mark it.
          </p>
          <p>
            Why bother? Plain JWT only proves <em>who issued the claims</em> — anyone can read
            them. Plain JWE only proves <em>nobody but the holder of the key has read them</em> — it
            doesn't prove who created them. <strong>Nested JWT gives you both:</strong>{' '}
            authenticity from the inner signature, confidentiality from the outer encryption.
            Common in OpenID Connect, healthcare/banking APIs, and anywhere one party signs and
            another reads a private message.
          </p>
          <p>
            Two distinct keypairs are involved: one for signing (sender holds private), one for
            encryption (recipient holds private).
          </p>
        </>
      }
    >
      <ToolPane
        title="Setup"
        contentClassName="grid gap-3 sm:grid-cols-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nest-sign-alg">Sign with</Label>
          <Select value={signAlg} onValueChange={(v) => setSignAlg(v as JwtAlg)}>
            <SelectTrigger id="nest-sign-alg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIGN_ALGS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nest-keyalg">Encrypt key wrap</Label>
          <Select value={keyAlg} onValueChange={(v) => setKeyAlg(v as JweKeyAlg)}>
            <SelectTrigger id="nest-keyalg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RSA-OAEP">RSA-OAEP</SelectItem>
              <SelectItem value="RSA-OAEP-256">RSA-OAEP-256</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nest-encalg">Content encryption</Label>
          <Select value={encAlg} onValueChange={(v) => setEncAlg(v as JweEncAlg)}>
            <SelectTrigger id="nest-encalg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A128GCM">A128GCM</SelectItem>
              <SelectItem value="A256GCM">A256GCM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ToolPane>

      <ToolPane
        title="Keypairs"
        description={
          isHmacInner
            ? 'Inner: HMAC secret (shared). Outer: RSA keypair for encryption.'
            : 'Inner: signature keypair. Outer: encryption keypair. Both rolled fresh.'
        }
        actions={
          <Button onClick={generate} disabled={generating} variant="outline" size="sm">
            {generating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            New keys
          </Button>
        }
      >
        {isHmacInner && (
          <div className="mb-3 flex flex-col gap-1.5">
            <Label htmlFor="nest-secret">Inner HMAC secret</Label>
            <Input
              id="nest-secret"
              value={hmacSecret}
              onChange={(e) => setHmacSecret(e.target.value)}
              className="font-mono"
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {generating
            ? 'Generating…'
            : encKp
              ? 'Encryption keypair: ready. ' +
                (isHmacInner ? 'Inner uses the HMAC secret above.' : 'Sign keypair: ready.')
              : 'No keys yet.'}
        </p>
      </ToolPane>

      <ToolPane title="Header (inner signature)">
        <JsonEditor value={headerJson} onChange={setHeaderJson} height="120px" />
      </ToolPane>

      <ToolPane title="Payload (claims)">
        <JsonEditor value={payloadJson} onChange={setPayloadJson} height="160px" />
      </ToolPane>

      <div className="flex justify-end">
        <Button onClick={onBuild} disabled={!encKp || (!isHmacInner && !signKp)}>
          Sign → Encrypt
        </Button>
      </div>

      {innerJws && (
        <motion.div
          animate={{
            opacity: buildPhase === 'encrypting' ? 0.55 : 1,
            scale: buildPhase === 'encrypting' ? 0.985 : 1,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <ToolPane
            title="Step 1 · Inner JWS"
            description="header . payload . signature — what JWT looks like on its own"
            actions={<CopyButton text={innerJws} iconOnly />}
          >
            <ColoredToken
              key={`inner-${buildRun}`}
              token={innerJws}
              partsCount={3}
              animate
            />
          </ToolPane>
        </motion.div>
      )}

      <AnimatePresence>
        {innerJws && outerJwe && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center text-muted-foreground"
          >
            <ArrowDown className="size-5" />
          </motion.div>
        )}
      </AnimatePresence>

      {outerJwe && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <ToolPane
            title="Step 2 · Outer JWE"
            description="header . encryptedKey . iv . ciphertext . tag — the inner JWS is the ciphertext"
            actions={<CopyButton text={outerJwe} iconOnly />}
          >
            <ColoredToken
              key={`outer-${buildRun}`}
              token={outerJwe}
              partsCount={5}
              animate
              highlightIndex={buildPhase === 'encrypting' ? 3 : undefined}
            />
          </ToolPane>
        </motion.div>
      )}

      <ToolPane
        title="Verify chain"
        description="Decrypts the outer JWE, then verifies the inner JWS signature."
        actions={<StatusPulse status={verifyStatus} />}
      >
        <Textarea
          value={verifyToken}
          onChange={(e) => setVerifyToken(e.target.value)}
          rows={5}
          className="font-mono text-[12px]"
          placeholder="paste a 5-part nested JWT here"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={onDecryptVerify} variant="outline" disabled={!verifyToken || !encKp}>
            Decrypt → Verify
          </Button>
        </div>
      </ToolPane>

      {decryptedInner && (
        <ToolPane title="After decrypt · Inner JWS revealed">
          <ColoredToken token={decryptedInner} partsCount={3} />
        </ToolPane>
      )}

      {verifiedClaims !== null && (
        <ToolPane title="After verify · Decoded claims">
          <pre className="rounded-md border bg-background p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-all">
            {JSON.stringify(verifiedClaims, null, 2)}
          </pre>
        </ToolPane>
      )}
    </ToolShell>
  )
}
