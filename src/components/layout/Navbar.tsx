import { Menu, Search, Sparkles } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

type Props = {
  onMenu: () => void
  onSearch: () => void
}

// Show the platform-correct shortcut: ⌘ on Mac, Ctrl everywhere else.
const isMac =
  typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform)

export function Navbar({ onMenu, onSearch }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onMenu}
          className="lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="size-5" />
        </Button>

        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </span>
          <span className="text-base">CryptoCanvas</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <button
            type="button"
            onClick={onSearch}
            className="hidden items-center gap-2 rounded-md border bg-background/60 py-1.5 pl-2.5 pr-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:flex"
            aria-label="Search tools"
          >
            <Search className="size-3.5" />
            <span className="text-xs">Search tools</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSearch}
            className="sm:hidden"
            aria-label="Search tools"
          >
            <Search className="size-5" />
          </Button>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground',
              )
            }
          >
            About
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
