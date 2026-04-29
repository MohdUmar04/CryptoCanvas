import { Link } from 'react-router-dom'
import { ArrowRight, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { categories, categoryOrder, getToolsByCategory } from '@/data/tools'

export function HomePage() {
  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <section className="mb-10 max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          A frontend playground for cryptography
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          See how text becomes <span className="text-primary">code</span>, and how code becomes{' '}
          <span className="text-info">cipher</span>.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          CryptoCanvas is a hands-on tour through encoding, hashing, encryption, and signing.
          Twiddle inputs, watch each step animate, and verify your understanding with green-pulse
          confirmation. Everything runs in your browser.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/tools/base64">
              Start with Base64 <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/about">How it works</Link>
          </Button>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-warning/40 bg-warning/10 p-4 sm:p-5">
        <div className="flex gap-3">
          <ShieldAlert className="size-5 shrink-0 text-warning" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-foreground">For learning only.</p>
            <p className="mt-1 text-foreground/80">
              CryptoCanvas runs every operation in your browser — your data does not leave the
              page. But this code is not audited and browsers are not hardened key stores. Don't
              use any output for real secrets. Data security on this site is your responsibility,
              not ours.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-10">
        {categoryOrder.map((cat) => {
          const tools = getToolsByCategory(cat)
          if (tools.length === 0) return null
          const meta = categories[cat]
          return (
            <div key={cat}>
              <header className="mb-3">
                <h2 className="text-lg font-semibold tracking-tight">{meta.label}</h2>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              </header>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <Link
                      key={tool.id}
                      to={tool.route}
                      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                    >
                      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md">
                        <CardContent className="flex h-full flex-col gap-2 p-4">
                          <div className="flex items-center gap-2.5">
                            <span className="grid size-8 place-items-center rounded-md bg-accent text-primary">
                              <Icon className="size-4" />
                            </span>
                            <CardTitle className="text-sm">{tool.title}</CardTitle>
                          </div>
                          <CardDescription className="text-[13px] leading-snug">
                            {tool.blurb}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
