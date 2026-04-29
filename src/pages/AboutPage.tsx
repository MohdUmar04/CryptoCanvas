import { Card, CardContent } from '@/components/ui/card'

export function AboutPage() {
  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-bold tracking-tight">About CryptoCanvas</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A frontend-only sandbox for understanding how cryptography works in practice.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 p-5">
            <h2 className="text-sm font-semibold">Why this exists</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Encoding, hashing, and encryption all blur together when you only see them in
              libraries. CryptoCanvas lets you watch each one with your own input — including the
              moments where things <em>fail</em> (wrong key, tampered ciphertext, bad signature).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <h2 className="text-sm font-semibold">What runs where</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Everything is browser-side. No backend, no analytics, no telemetry. The site uses the
              Web Crypto API for AES, RSA, ECDSA, SHA-* and HMAC; <code>jose</code> for JWT/JWS/JWE;
              and <code>@noble/*</code> libraries for MD5 and Ed25519.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <h2 className="text-sm font-semibold">What it isn't</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This is not a security product. The code is not professionally audited. Browsers
              don't isolate keys the way HSMs do. Don't paste real secrets into it.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <h2 className="text-sm font-semibold">Visualization</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Each tool ships with a written explanation, optional step-by-step animation, and
              live feedback — green pulse on a verified signature or successful decryption, red
              shake on tampering or a wrong key.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
