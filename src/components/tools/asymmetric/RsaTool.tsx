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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getToolById } from '@/data/tools'
import { base64ToBytes, bytesToBase64, bytesToUtf8, utf8ToBytes } from '@/lib/bytes'
import {
  exportKeyJwk,
  exportKeyPem,
  generateRsaKeyPair,
  rsaOaepDecrypt,
  rsaOaepEncrypt,
  rsaPssSign,
  rsaPssVerify,
  type RsaPurpose,
  type RsaSize,
} from '@/lib/asymmetric'
import type { Status } from '@/lib/types'
import { KeyDisplay } from './KeyDisplay'
import { RsaToyPanel } from './RsaToyPanel'

export function RsaTool() {
  const tool = getToolById('rsa')!
  const [purpose, setPurpose] = useState<RsaPurpose>('encrypt')
  const [size, setSize] = useState<RsaSize>(2048)
  const [keypair, setKeypair] = useState<CryptoKeyPair | null>(null)
  const [publicPem, setPublicPem] = useState('')
  const [privatePem, setPrivatePem] = useState('')
  const [publicJwk, setPublicJwk] = useState('')
  const [privateJwk, setPrivateJwk] = useState('')
  const [generating, setGenerating] = useState(false)

  const generate = useCallback(async () => {
    setGenerating(true)
    try {
      const kp = await generateRsaKeyPair(size, purpose)
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
  }, [size, purpose])

  useEffect(() => {
    void generate()
  }, [generate])

  return (
    <ToolShell
      tool={tool}
      explanation={
        <>
          <p>
            <strong>RSA</strong> uses a public/private keypair: anyone can encrypt to your public
            key, but only the holder of the matching private key can decrypt. Or, the holder of the
            private key can sign a message and anyone with the public key can verify it — without
            being able to forge new signatures.
          </p>
          <p>
            <strong>RSA-OAEP</strong> is the modern padding for encryption.{' '}
            <strong>RSA-PSS</strong> is the modern padding for signatures. Both use SHA-256 here.
          </p>
          <p>
            Key size: 2048 is the floor for current systems; 3072 is recommended; 4096 is paranoid
            (and slow). RSA-OAEP can only encrypt up to ~190 bytes for a 2048-bit key — for longer
            messages, encrypt a symmetric key and use AES.
          </p>
        </>
      }
    >
      <ToolPane
        title="Setup"
        contentClassName="grid gap-3 sm:grid-cols-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label>Purpose</Label>
          <Tabs value={purpose} onValueChange={(v) => setPurpose(v as RsaPurpose)}>
            <TabsList>
              <TabsTrigger value="encrypt">Encrypt (OAEP)</TabsTrigger>
              <TabsTrigger value="sign">Sign (PSS)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rsa-size">Key size</Label>
          <Select value={String(size)} onValueChange={(v) => setSize(Number(v) as RsaSize)}>
            <SelectTrigger id="rsa-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2048">2048-bit</SelectItem>
              <SelectItem value="3072">3072-bit</SelectItem>
              <SelectItem value="4096">4096-bit (slow)</SelectItem>
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

      {keypair && purpose === 'encrypt' && <EncryptPanel keypair={keypair} />}
      {keypair && purpose === 'sign' && <SignPanel keypair={keypair} />}

      <RsaToyPanel />
    </ToolShell>
  )
}

function EncryptPanel({ keypair }: { keypair: CryptoKeyPair }) {
  const [plaintext, setPlaintext] = useState('Encrypted with the public key.')
  const [ciphertext, setCiphertext] = useState('')
  const [decrypted, setDecrypted] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onEncrypt = async () => {
    try {
      const ct = await rsaOaepEncrypt(keypair.publicKey, utf8ToBytes(plaintext))
      setCiphertext(bytesToBase64(ct))
      setStatus({ kind: 'success', message: 'Encrypted with public key' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }
  const onDecrypt = async () => {
    try {
      const pt = await rsaOaepDecrypt(keypair.privateKey, base64ToBytes(ciphertext))
      setDecrypted(bytesToUtf8(pt))
      setStatus({ kind: 'success', message: 'Decrypted with private key' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <>
      <ToolPane title="Plaintext" actions={<StatusPulse status={status} />}>
        <Textarea
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          rows={3}
          className="font-sans"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={onEncrypt}>Encrypt with public key</Button>
        </div>
      </ToolPane>

      <ToolPane
        title="Ciphertext (base64)"
        actions={ciphertext ? <CopyButton text={ciphertext} iconOnly /> : null}
      >
        <Textarea
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
          rows={4}
          className="font-mono text-[12px]"
          placeholder="base64 ciphertext"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={onDecrypt} variant="outline" disabled={!ciphertext}>
            Decrypt with private key
          </Button>
        </div>
      </ToolPane>

      <ToolPane
        title="Decrypted plaintext"
        actions={decrypted ? <CopyButton text={decrypted} iconOnly /> : null}
      >
        <div className="rounded-md border bg-background px-3 py-2 font-sans text-sm break-all min-h-[2.4rem] whitespace-pre-wrap">
          {decrypted || <span className="text-muted-foreground">…</span>}
        </div>
      </ToolPane>
    </>
  )
}

function SignPanel({ keypair }: { keypair: CryptoKeyPair }) {
  const [message, setMessage] = useState('CryptoCanvas signed message')
  const [signature, setSignature] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onSign = async () => {
    try {
      const sig = await rsaPssSign(keypair.privateKey, utf8ToBytes(message))
      setSignature(bytesToBase64(sig))
      setStatus({ kind: 'success', message: 'Signed with private key' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }
  const onVerify = async () => {
    try {
      const ok = await rsaPssVerify(keypair.publicKey, base64ToBytes(signature), utf8ToBytes(message))
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
    <>
      <ToolPane title="Message" actions={<StatusPulse status={status} />}>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="font-sans"
        />
        <div className="mt-2 flex justify-end gap-2">
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
          rows={4}
          className="font-mono text-[12px]"
          placeholder="base64 signature"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={onVerify} variant="outline" disabled={!signature}>
            Verify with public key
          </Button>
        </div>
      </ToolPane>
    </>
  )
}
