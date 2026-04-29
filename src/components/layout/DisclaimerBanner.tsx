import { AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function DisclaimerBanner() {
  return (
    <div className="border-b bg-warning/15 text-warning-foreground/90">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-1.5 text-xs sm:text-[13px]">
        <AlertTriangle className="size-3.5 shrink-0 text-warning" />
        <span className="text-foreground/90">
          <strong className="font-semibold">Educational use only.</strong>{' '}
          All operations run in your browser — no data leaves your device — but this code is not
          security-audited.{' '}
          <Dialog>
            <DialogTrigger className="font-medium underline underline-offset-2 hover:text-foreground">
              Read the full notice
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>About this site</DialogTitle>
                <DialogDescription>
                  Read this before relying on any output from CryptoCanvas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
                <p>
                  CryptoCanvas is a learning playground. It implements common encodings, classical
                  ciphers, hashing algorithms, symmetric/asymmetric encryption, and JSON token
                  formats so you can see how they work — both in writing and visually.
                </p>
                <p>
                  <strong>Everything runs in your browser.</strong> Your input, keys, and ciphertext
                  never touch a server we control. There is no backend, no analytics, no telemetry.
                  Power off your network and the site still works.
                </p>
                <p>
                  <strong>Do not use it for real secrets.</strong> The code has not been
                  professionally audited. Browser environments are not a hardened key store.
                  Real-world cryptography requires careful key management, secure transport, vetted
                  libraries, and threat modeling that an interactive web demo cannot provide.
                </p>
                <p>
                  Use it to learn, experiment, and check ideas — not to protect data that matters.
                  Data security on this site is your responsibility, not ours.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </span>
      </div>
    </div>
  )
}
