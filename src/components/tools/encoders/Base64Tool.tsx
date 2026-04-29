import { useState } from 'react'
import { EncoderTool } from '@/components/common/EncoderTool'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getToolById } from '@/data/tools'
import { base64ToText, textToBase64 } from '@/lib/encoders/base64'

export function Base64Tool() {
  const tool = getToolById('base64')!
  const [urlSafe, setUrlSafe] = useState(false)

  return (
    <EncoderTool
      tool={tool}
      encode={(t) => textToBase64(t, urlSafe)}
      decode={(e) => base64ToText(e, urlSafe)}
      optionsKey={urlSafe ? 'url' : 'std'}
      encodedLabel={urlSafe ? 'Base64 (URL-safe)' : 'Base64'}
      encodedPlaceholder={urlSafe ? 'SGVsbG8sIHdvcmxkIQ' : 'SGVsbG8sIHdvcmxkIQ=='}
      options={
        <div className="flex items-center gap-2">
          <Switch id="b64-urlsafe" checked={urlSafe} onCheckedChange={setUrlSafe} />
          <Label htmlFor="b64-urlsafe">URL-safe alphabet</Label>
          <p className="text-xs text-muted-foreground">
            Replaces <code>+</code>/<code>/</code> with <code>-</code>/<code>_</code> and drops
            padding.
          </p>
        </div>
      }
      explanation={
        <>
          <p>
            Base64 packs 3 bytes (24 bits) into 4 ASCII characters from a 64-character alphabet
            (A–Z, a–z, 0–9, <code>+</code>, <code>/</code>). Padding <code>=</code> rounds the
            output length up to a multiple of four when needed.
          </p>
          <p>
            URL-safe Base64 swaps the two non-alphanumerics for <code>-</code> and <code>_</code> so
            the output is safe inside URLs and filenames.
          </p>
        </>
      }
    />
  )
}
