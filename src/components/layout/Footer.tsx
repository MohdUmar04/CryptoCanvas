import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function Footer() {
  return (
    <footer className="border-t bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
        <p>
          CryptoCanvas — built for learning. Not for production secrets. Data security on this site
          is your responsibility, not ours.
        </p>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
          <Dialog>
            <DialogTrigger className="hover:text-foreground">Disclaimer</DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Full disclaimer</DialogTitle>
                <DialogDescription>
                  CryptoCanvas is for education. Read this before trusting any output.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
                <p>
                  All cryptographic operations on CryptoCanvas execute entirely in your browser via
                  the Web Crypto API and audited libraries (jose, @noble/*). Nothing is transmitted
                  to a server.
                </p>
                <p>
                  However: this site is <strong>not security-audited</strong>, browsers are{' '}
                  <strong>not hardened key stores</strong>, and copy-paste workflows are easy to get
                  wrong. Treat any key, ciphertext, or signature you generate here as
                  demonstration-grade only.
                </p>
                <p>
                  By using CryptoCanvas you acknowledge that the authors are not responsible for any
                  loss, leak, or compromise resulting from its use. Use vetted libraries, hardware
                  security modules, and established protocols for anything that matters.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </footer>
  )
}
