import { CopyButton } from '@/components/common/CopyButton'
import { ToolPane } from '@/components/common/ToolPane'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Props = {
  title: string
  pem: string
  jwk: string
  visibility: 'public' | 'private'
}

export function KeyDisplay({ title, pem, jwk, visibility }: Props) {
  return (
    <ToolPane
      title={title}
      description={visibility === 'private' ? 'Keep this secret.' : 'Safe to share.'}
    >
      <Tabs defaultValue="pem">
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="pem">PEM</TabsTrigger>
            <TabsTrigger value="jwk">JWK</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="pem">
          <div className="relative">
            <pre className="max-h-56 overflow-auto rounded-md border bg-background p-3 font-mono text-[11px] leading-tight whitespace-pre">
              {pem || '…'}
            </pre>
            {pem && <CopyButton text={pem} className="absolute right-2 top-2" iconOnly />}
          </div>
        </TabsContent>
        <TabsContent value="jwk">
          <div className="relative">
            <pre className="max-h-56 overflow-auto rounded-md border bg-background p-3 font-mono text-[11px] leading-tight whitespace-pre">
              {jwk || '…'}
            </pre>
            {jwk && <CopyButton text={jwk} className="absolute right-2 top-2" iconOnly />}
          </div>
        </TabsContent>
      </Tabs>
    </ToolPane>
  )
}
