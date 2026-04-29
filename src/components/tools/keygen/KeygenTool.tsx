import { Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
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
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getToolById } from '@/data/tools'
import {
  exportKeyJwk,
  exportKeyPem,
  generateEcdsaKeyPair,
  generateRsaKeyPair,
  type EcCurve,
  type RsaSize,
} from '@/lib/asymmetric'
import { bytesToHex, randomBytes } from '@/lib/bytes'
import { generateEd25519Pair, generatePassword } from '@/lib/random'
import { KeyDisplay } from '@/components/tools/asymmetric/KeyDisplay'

export function KeygenTool() {
  const tool = getToolById('keygen')!
  return (
    <ToolShell
      tool={tool}
      explanation={
        <>
          <p>
            Every key on this page is generated with{' '}
            <code>crypto.getRandomValues</code> — never <code>Math.random</code>. RSA and ECDSA
            keypairs use Web Crypto's hardened RNG via <code>generateKey</code>; Ed25519 uses{' '}
            <code>@noble/curves</code>.
          </p>
          <p>
            Treat anything generated here as <em>demo material</em>. Real production keys deserve
            an HSM or platform secret-manager.
          </p>
        </>
      }
    >
      <Tabs defaultValue="symmetric">
        <TabsList className="flex-wrap">
          <TabsTrigger value="symmetric">Symmetric</TabsTrigger>
          <TabsTrigger value="rsa">RSA</TabsTrigger>
          <TabsTrigger value="ecdsa">ECDSA</TabsTrigger>
          <TabsTrigger value="ed25519">Ed25519</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="symmetric">
          <SymmetricPanel />
        </TabsContent>
        <TabsContent value="rsa">
          <RsaPanel />
        </TabsContent>
        <TabsContent value="ecdsa">
          <EcdsaPanel />
        </TabsContent>
        <TabsContent value="ed25519">
          <Ed25519Panel />
        </TabsContent>
        <TabsContent value="password">
          <PasswordPanel />
        </TabsContent>
      </Tabs>
    </ToolShell>
  )
}

/* ---------- Symmetric ---------- */

function SymmetricPanel() {
  const [bits, setBits] = useState<128 | 192 | 256>(256)
  const [key, setKey] = useState('')
  const roll = useCallback(() => setKey(bytesToHex(randomBytes(bits / 8))), [bits])
  useEffect(() => {
    roll()
  }, [roll])
  return (
    <ToolPane
      title="AES / HMAC key (random bytes)"
      description={`${bits}-bit (${bits / 8} bytes), encoded as hex.`}
      actions={
        <Button onClick={roll} variant="outline" size="sm">
          <RefreshCw className="size-3.5" /> Roll
        </Button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sym-bits">Size</Label>
          <Select
            value={String(bits)}
            onValueChange={(v) => setBits(Number(v) as 128 | 192 | 256)}
          >
            <SelectTrigger id="sym-bits" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="128">128-bit</SelectItem>
              <SelectItem value="192">192-bit</SelectItem>
              <SelectItem value="256">256-bit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input value={key} onChange={(e) => setKey(e.target.value)} className="font-mono text-[12px]" />
        {key && <CopyButton text={key} iconOnly />}
      </div>
    </ToolPane>
  )
}

/* ---------- RSA ---------- */

function RsaPanel() {
  const [size, setSize] = useState<RsaSize>(2048)
  const [publicPem, setPublicPem] = useState('')
  const [privatePem, setPrivatePem] = useState('')
  const [publicJwk, setPublicJwk] = useState('')
  const [privateJwk, setPrivateJwk] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = useCallback(async () => {
    setLoading(true)
    try {
      const kp = await generateRsaKeyPair(size, 'sign')
      const [pubP, privP, pubJ, privJ] = await Promise.all([
        exportKeyPem(kp.publicKey, 'public'),
        exportKeyPem(kp.privateKey, 'private'),
        exportKeyJwk(kp.publicKey),
        exportKeyJwk(kp.privateKey),
      ])
      setPublicPem(pubP)
      setPrivatePem(privP)
      setPublicJwk(pubJ)
      setPrivateJwk(privJ)
    } finally {
      setLoading(false)
    }
  }, [size])

  useEffect(() => {
    void generate()
  }, [generate])

  return (
    <>
      <ToolPane
        title="RSA keypair"
        description="Generated for RSA-PSS signing; same modulus is reusable for OAEP key wrap."
        actions={
          <Button onClick={generate} disabled={loading} variant="outline" size="sm">
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            New
          </Button>
        }
      >
        <div className="flex flex-col gap-1.5 max-w-40">
          <Label htmlFor="rsa-keysize">Modulus</Label>
          <Select value={String(size)} onValueChange={(v) => setSize(Number(v) as RsaSize)}>
            <SelectTrigger id="rsa-keysize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2048">2048-bit</SelectItem>
              <SelectItem value="3072">3072-bit</SelectItem>
              <SelectItem value="4096">4096-bit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ToolPane>
      <KeyDisplay title="Public key" pem={publicPem} jwk={publicJwk} visibility="public" />
      <KeyDisplay title="Private key" pem={privatePem} jwk={privateJwk} visibility="private" />
    </>
  )
}

/* ---------- ECDSA ---------- */

function EcdsaPanel() {
  const [curve, setCurve] = useState<EcCurve>('P-256')
  const [publicPem, setPublicPem] = useState('')
  const [privatePem, setPrivatePem] = useState('')
  const [publicJwk, setPublicJwk] = useState('')
  const [privateJwk, setPrivateJwk] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = useCallback(async () => {
    setLoading(true)
    try {
      const kp = await generateEcdsaKeyPair(curve)
      const [pubP, privP, pubJ, privJ] = await Promise.all([
        exportKeyPem(kp.publicKey, 'public'),
        exportKeyPem(kp.privateKey, 'private'),
        exportKeyJwk(kp.publicKey),
        exportKeyJwk(kp.privateKey),
      ])
      setPublicPem(pubP)
      setPrivatePem(privP)
      setPublicJwk(pubJ)
      setPrivateJwk(privJ)
    } finally {
      setLoading(false)
    }
  }, [curve])

  useEffect(() => {
    void generate()
  }, [generate])

  return (
    <>
      <ToolPane
        title="ECDSA keypair"
        actions={
          <Button onClick={generate} disabled={loading} variant="outline" size="sm">
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            New
          </Button>
        }
      >
        <div className="flex flex-col gap-1.5 max-w-40">
          <Label htmlFor="ec-curve-keygen">Curve</Label>
          <Select value={curve} onValueChange={(v) => setCurve(v as EcCurve)}>
            <SelectTrigger id="ec-curve-keygen">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P-256">P-256</SelectItem>
              <SelectItem value="P-384">P-384</SelectItem>
              <SelectItem value="P-521">P-521</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ToolPane>
      <KeyDisplay title="Public key" pem={publicPem} jwk={publicJwk} visibility="public" />
      <KeyDisplay title="Private key" pem={privatePem} jwk={privateJwk} visibility="private" />
    </>
  )
}

/* ---------- Ed25519 ---------- */

function Ed25519Panel() {
  const [pub, setPub] = useState('')
  const [priv, setPriv] = useState('')
  const generate = useCallback(() => {
    const kp = generateEd25519Pair()
    setPub(bytesToHex(kp.publicKey))
    setPriv(bytesToHex(kp.privateKey))
  }, [])
  useEffect(() => {
    generate()
  }, [generate])

  return (
    <ToolPane
      title="Ed25519 keypair"
      description="32-byte public and private keys, encoded as hex."
      actions={
        <Button onClick={generate} variant="outline" size="sm">
          <RefreshCw className="size-3.5" /> New
        </Button>
      }
    >
      <div className="space-y-3">
        <KeyRow label="Public key" value={pub} />
        <KeyRow label="Private key" value={priv} secret />
      </div>
    </ToolPane>
  )
}

function KeyRow({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className={secret ? 'text-warning-foreground' : undefined}>{label}</Label>
        {value && <CopyButton text={value} iconOnly />}
      </div>
      <code className="block break-all rounded-md border bg-background px-3 py-2 font-mono text-[12px]">
        {value || '…'}
      </code>
    </div>
  )
}

/* ---------- Password ---------- */

function PasswordPanel() {
  const [length, setLength] = useState(20)
  const [lower, setLower] = useState(true)
  const [upper, setUpper] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [pw, setPw] = useState('')
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(() => {
    try {
      setPw(generatePassword({ length, lower, upper, digits, symbols }))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [length, lower, upper, digits, symbols])

  useEffect(() => {
    generate()
  }, [generate])

  const entropy = useMemo(() => {
    let alphabet = 0
    if (lower) alphabet += 26
    if (upper) alphabet += 26
    if (digits) alphabet += 10
    if (symbols) alphabet += 26
    if (alphabet === 0) return 0
    return Math.round(length * Math.log2(alphabet))
  }, [length, lower, upper, digits, symbols])

  return (
    <ToolPane
      title="Random password"
      description={`Drawn from your enabled character classes via crypto.getRandomValues.`}
      actions={
        <Button onClick={generate} variant="outline" size="sm">
          <RefreshCw className="size-3.5" /> New
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex w-full max-w-xs items-center gap-3">
            <Label htmlFor="pw-len" className="shrink-0">
              Length: <span className="text-primary tabular-nums">{length}</span>
            </Label>
            <Slider
              id="pw-len"
              min={6}
              max={64}
              step={1}
              value={[length]}
              onValueChange={(v) => setLength(v[0])}
            />
          </div>
          <Toggle id="pw-lower" label="a–z" checked={lower} onChange={setLower} />
          <Toggle id="pw-upper" label="A–Z" checked={upper} onChange={setUpper} />
          <Toggle id="pw-digits" label="0–9" checked={digits} onChange={setDigits} />
          <Toggle id="pw-symbols" label="!@#" checked={symbols} onChange={setSymbols} />
        </div>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-md border bg-background px-3 py-2 font-mono text-base">
                {pw || '…'}
              </code>
              {pw && <CopyButton text={pw} iconOnly />}
            </div>
            <p className="text-xs text-muted-foreground">
              ≈ <span className="tabular-nums text-foreground">{entropy}</span> bits of entropy
            </p>
          </>
        )}
      </div>
    </ToolPane>
  )
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="font-mono text-xs">
        {label}
      </Label>
    </div>
  )
}
