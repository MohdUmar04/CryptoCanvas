import { Loader2, Timer } from 'lucide-react'
import { useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { ToolPane } from '@/components/common/ToolPane'
import { ToolShell } from '@/components/common/ToolShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getToolById } from '@/data/tools'
import { bytesToHex } from '@/lib/bytes'
import { derivePbkdf2, deriveScrypt, timeDerivation } from '@/lib/kdf'
import { cn } from '@/lib/utils'

type Algo = 'pbkdf2' | 'scrypt'

export function KdfTool() {
  const tool = getToolById('kdf')!
  const [algo, setAlgo] = useState<Algo>('pbkdf2')
  const [password, setPassword] = useState('correct horse battery staple')
  const [salt, setSalt] = useState('random-salt-value')

  // PBKDF2 iteration count as a power of ten exponent (10^n).
  const [iterExp, setIterExp] = useState(5) // 100,000
  const iterations = 10 ** iterExp
  // scrypt cost parameter N as a power of two exponent.
  const [nExp, setNExp] = useState(14) // 16,384
  const N = 2 ** nExp

  const [result, setResult] = useState<{ hex: string; ms: number } | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      const { key, ms } = await timeDerivation(() =>
        algo === 'pbkdf2'
          ? derivePbkdf2(password, salt, iterations, 32)
          : deriveScrypt(password, salt, N, 8, 1, 32),
      )
      setResult({ hex: bytesToHex(key), ms })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setResult(null)
    } finally {
      setRunning(false)
    }
  }

  return (
    <ToolShell
      tool={tool}
      explanation={
        <>
          <p>
            A <strong>password-based key derivation function</strong> turns a low-entropy password
            into a fixed-length key — <em>slowly and deliberately</em>. Plain hashes like SHA-256
            are far too fast: an attacker can try billions of guesses per second. A KDF adds a{' '}
            <strong>work factor</strong> so each guess costs real time.
          </p>
          <p>
            <strong>PBKDF2</strong> repeats HMAC many times (the iteration count is the work
            factor). <strong>scrypt</strong> also demands a lot of <em>memory</em> (the{' '}
            <code>N</code> cost), which blunts the advantage of custom cracking hardware. Drag the
            sliders and watch the derivation time climb — that time is exactly what protects the
            password.
          </p>
        </>
      }
    >
      <ToolPane title="Algorithm">
        <Tabs value={algo} onValueChange={(v) => setAlgo(v as Algo)}>
          <TabsList>
            <TabsTrigger value="pbkdf2">PBKDF2-SHA256</TabsTrigger>
            <TabsTrigger value="scrypt">scrypt</TabsTrigger>
          </TabsList>
        </Tabs>
      </ToolPane>

      <ToolPane title="Inputs" contentClassName="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kdf-pw">Password</Label>
          <Input
            id="kdf-pw"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kdf-salt">Salt</Label>
          <Input
            id="kdf-salt"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            className="font-mono"
          />
        </div>
      </ToolPane>

      <ToolPane title="Work factor">
        {algo === 'pbkdf2' ? (
          <div className="flex flex-col gap-2">
            <Label>
              Iterations:{' '}
              <span className="font-mono tabular-nums text-primary">
                {iterations.toLocaleString('en-US')}
              </span>
            </Label>
            <Slider
              min={3}
              max={7}
              step={1}
              value={[iterExp]}
              onValueChange={(v) => setIterExp(v[0])}
            />
            <p className="text-xs text-muted-foreground">
              OWASP currently recommends ≥ 600,000 iterations for PBKDF2-HMAC-SHA256.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label>
              N (CPU/memory cost):{' '}
              <span className="font-mono tabular-nums text-primary">
                2<sup>{nExp}</sup> = {N.toLocaleString('en-US')}
              </span>
            </Label>
            <Slider min={10} max={17} step={1} value={[nExp]} onValueChange={(v) => setNExp(v[0])} />
            <p className="text-xs text-muted-foreground">
              With r=8, memory use ≈ {((128 * 8 * N) / 1024 / 1024).toFixed(1)} MB. Interactive
              logins typically use N = 2<sup>14</sup>–2<sup>17</sup>.
            </p>
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <Button onClick={run} disabled={running}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Timer className="size-4" />}
            Derive key
          </Button>
        </div>
      </ToolPane>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {result && (
        <ToolPane
          title="Derived key (256-bit)"
          actions={<CopyButton text={result.hex} iconOnly />}
        >
          <code className="block overflow-x-auto whitespace-nowrap rounded-md border bg-background px-3 py-2 text-[12px] text-foreground/90">
            {result.hex}
          </code>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Timer className="size-4 text-primary" />
            <span>
              Took{' '}
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  result.ms > 250 ? 'text-warning' : 'text-success',
                )}
              >
                {result.ms.toFixed(1)} ms
              </span>{' '}
              on this device.
            </span>
            <span className="text-muted-foreground">
              An attacker pays this cost for <em>every single guess</em>.
            </span>
          </div>
        </ToolPane>
      )}
    </ToolShell>
  )
}
