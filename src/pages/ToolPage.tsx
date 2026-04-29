import { ArrowLeft, Loader2 } from 'lucide-react'
import { Suspense, lazy, type ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getToolById, type Tool } from '@/data/tools'

const TOOL_COMPONENTS: Record<string, ComponentType> = {
  binary: lazy(() =>
    import('@/components/tools/encoders/BinaryTool').then((m) => ({ default: m.BinaryTool })),
  ),
  ascii: lazy(() =>
    import('@/components/tools/encoders/AsciiTool').then((m) => ({ default: m.AsciiTool })),
  ),
  hex: lazy(() =>
    import('@/components/tools/encoders/HexTool').then((m) => ({ default: m.HexTool })),
  ),
  base64: lazy(() =>
    import('@/components/tools/encoders/Base64Tool').then((m) => ({ default: m.Base64Tool })),
  ),
  base32: lazy(() =>
    import('@/components/tools/encoders/Base32Tool').then((m) => ({ default: m.Base32Tool })),
  ),
  url: lazy(() =>
    import('@/components/tools/encoders/UrlTool').then((m) => ({ default: m.UrlTool })),
  ),
  html: lazy(() =>
    import('@/components/tools/encoders/HtmlTool').then((m) => ({ default: m.HtmlTool })),
  ),
  morse: lazy(() =>
    import('@/components/tools/encoders/MorseTool').then((m) => ({ default: m.MorseTool })),
  ),
  rot: lazy(() =>
    import('@/components/tools/encoders/RotTool').then((m) => ({ default: m.RotTool })),
  ),
  caesar: lazy(() =>
    import('@/components/tools/ciphers/CaesarTool').then((m) => ({ default: m.CaesarTool })),
  ),
  vigenere: lazy(() =>
    import('@/components/tools/ciphers/VigenereTool').then((m) => ({ default: m.VigenereTool })),
  ),
  xor: lazy(() =>
    import('@/components/tools/ciphers/XorTool').then((m) => ({ default: m.XorTool })),
  ),
  hash: lazy(() =>
    import('@/components/tools/hashing/HashTool').then((m) => ({ default: m.HashTool })),
  ),
  hmac: lazy(() =>
    import('@/components/tools/hashing/HmacTool').then((m) => ({ default: m.HmacTool })),
  ),
  aes: lazy(() =>
    import('@/components/tools/symmetric/AesTool').then((m) => ({ default: m.AesTool })),
  ),
  rsa: lazy(() =>
    import('@/components/tools/asymmetric/RsaTool').then((m) => ({ default: m.RsaTool })),
  ),
  ecdsa: lazy(() =>
    import('@/components/tools/asymmetric/EcdsaTool').then((m) => ({ default: m.EcdsaTool })),
  ),
  jwt: lazy(() =>
    import('@/components/tools/tokens/JwtTool').then((m) => ({ default: m.JwtTool })),
  ),
  jws: lazy(() =>
    import('@/components/tools/tokens/JwsTool').then((m) => ({ default: m.JwsTool })),
  ),
  jwe: lazy(() =>
    import('@/components/tools/tokens/JweTool').then((m) => ({ default: m.JweTool })),
  ),
  nested: lazy(() =>
    import('@/components/tools/tokens/NestedJwtTool').then((m) => ({
      default: m.NestedJwtTool,
    })),
  ),
  keygen: lazy(() =>
    import('@/components/tools/keygen/KeygenTool').then((m) => ({ default: m.KeygenTool })),
  ),
}

function ToolFallback({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{tool.title}</h1>
          <p className="text-sm text-muted-foreground">{tool.blurb}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-dashed bg-card/50 p-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading…
      </div>
    </div>
  )
}

function ComingSoon({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{tool.title}</h1>
          <p className="text-sm text-muted-foreground">{tool.blurb}</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
        Coming up next — this tool's interactive panel lands in the upcoming build steps.
      </div>
    </div>
  )
}

function ToolNotFound({ id }: { id?: string }) {
  return (
    <div className="px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Tool not found</h1>
      <p className="text-muted-foreground">No tool exists with id "{id}".</p>
      <Button asChild className="mt-4" variant="outline">
        <Link to="/">
          <ArrowLeft className="size-4" /> Back home
        </Link>
      </Button>
    </div>
  )
}

export function ToolPage() {
  const { id } = useParams<{ id: string }>()
  const tool = getToolById(id)
  if (!tool) return <ToolNotFound id={id} />
  const Comp = TOOL_COMPONENTS[tool.id]
  if (!Comp) return <ComingSoon tool={tool} />
  return (
    <Suspense fallback={<ToolFallback tool={tool} />}>
      <Comp />
    </Suspense>
  )
}
