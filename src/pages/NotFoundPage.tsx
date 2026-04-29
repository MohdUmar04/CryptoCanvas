import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Lost in the cipher.</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        That route does not match any of CryptoCanvas's tools.
      </p>
      <Button asChild className="mt-2">
        <Link to="/">Take me home</Link>
      </Button>
    </div>
  )
}
