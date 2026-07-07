import { useMemo, useState } from 'react'
import { ToolPane } from '@/components/common/ToolPane'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  makeToyKey,
  toyEncryptText,
  TOY_PRIMES,
  validPublicExponents,
} from '@/lib/rsa-toy'
import { cn } from '@/lib/utils'

/**
 * A "toy numbers" RSA sandbox that runs alongside the real WebCrypto RSA above,
 * exposing the modular arithmetic that the production keys hide.
 */
export function RsaToyPanel() {
  const [p, setP] = useState(61)
  const [q, setQ] = useState(53)
  const [message, setMessage] = useState('Hi')
  const [eStr, setEStr] = useState('17')

  const phi = (p - 1) * (q - 1)
  const exponents = useMemo(() => validPublicExponents(phi), [phi])
  const e = exponents.includes(Number(eStr)) ? Number(eStr) : exponents[0]

  const built = useMemo(() => {
    try {
      const key = makeToyKey(p, q, e)
      const steps = toyEncryptText(message, key)
      return { key, steps, error: null as string | null }
    } catch (err) {
      return { key: null, steps: [], error: err instanceof Error ? err.message : String(err) }
    }
  }, [p, q, e, message])

  const key = built.key

  return (
    <ToolPane
      title="Toy RSA — see the actual math"
      description="The same algorithm as above, with primes small enough to follow by hand."
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <PrimePicker label="p (prime)" value={p} onChange={setP} />
          <PrimePicker label="q (prime)" value={q} onChange={setQ} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="toy-e">e (public exp)</Label>
            <Select value={String(e)} onValueChange={setEStr}>
              <SelectTrigger id="toy-e">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exponents.map((cand) => (
                  <SelectItem key={cand} value={String(cand)}>
                    {cand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="toy-msg">Message</Label>
            <Input
              id="toy-msg"
              value={message}
              onChange={(ev) => setMessage(ev.target.value)}
              className="font-mono"
              maxLength={12}
            />
          </div>
        </div>

        {built.error ? (
          <p className="text-sm text-destructive" role="alert">
            {built.error}
          </p>
        ) : (
          key && (
            <>
              <div className="grid gap-2 font-mono text-sm sm:grid-cols-2">
                <Derivation label="n = p × q" expr={`${p} × ${q} = ${key.n}`} note="the modulus" />
                <Derivation
                  label="φ(n) = (p−1)(q−1)"
                  expr={`${p - 1} × ${q - 1} = ${key.phi}`}
                  note="Euler's totient"
                />
                <Derivation
                  label="Public key"
                  expr={`(e, n) = (${key.e}, ${key.n})`}
                  note="share freely"
                  accent
                />
                <Derivation
                  label="Private key"
                  expr={`d = e⁻¹ mod φ = ${key.d}`}
                  note={`because ${key.e}·${key.d} mod ${key.phi} = 1`}
                  accent
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-1">char</th>
                      <th className="px-2 py-1">m</th>
                      <th className="px-2 py-1">encrypt: mᵉ mod n</th>
                      <th className="px-2 py-1">decrypt: cᵈ mod n</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {built.steps.map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{s.char === ' ' ? '␣' : s.char}</td>
                        <td className="px-2 py-1 tabular-nums">{s.m}</td>
                        <td className="px-2 py-1 tabular-nums">
                          {s.m}
                          <sup>{key.e}</sup> mod {key.n} ={' '}
                          <span className="font-semibold text-primary">{s.c}</span>
                        </td>
                        <td className="px-2 py-1 tabular-nums">
                          {s.c}
                          <sup>{key.d}</sup> mod {key.n} ={' '}
                          <span
                            className={cn(
                              'font-semibold',
                              s.back === s.m ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {s.back}
                          </span>{' '}
                          → {String.fromCodePoint(s.back)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Textbook RSA like this is deterministic and insecure — real RSA-OAEP (above) adds
                randomized padding. This panel is purely to show the arithmetic.
              </p>
            </>
          )
        )}
      </div>
    </ToolPane>
  )
}

function PrimePicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TOY_PRIMES.map((prime) => (
            <SelectItem key={prime} value={String(prime)}>
              {prime}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function Derivation({
  label,
  expr,
  note,
  accent,
}: {
  label: string
  expr: string
  note: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2',
        accent ? 'border-primary/40 bg-primary/5' : 'bg-background',
      )}
    >
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-foreground/90">{expr}</div>
      <div className="text-[10px] text-muted-foreground">{note}</div>
    </div>
  )
}
