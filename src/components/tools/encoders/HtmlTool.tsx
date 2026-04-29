import { useState } from 'react'
import { EncoderTool } from '@/components/common/EncoderTool'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getToolById } from '@/data/tools'
import { htmlDecode, htmlEncode, type HtmlEncodeMode } from '@/lib/encoders/html'

export function HtmlTool() {
  const tool = getToolById('html')!
  const [mode, setMode] = useState<HtmlEncodeMode>('named')

  return (
    <EncoderTool
      tool={tool}
      encode={(t) => htmlEncode(t, mode)}
      decode={htmlDecode}
      optionsKey={mode}
      encodedLabel="HTML-escaped"
      encodedPlaceholder="&lt;b&gt;Hello &amp; goodbye&lt;/b&gt;"
      options={
        <div className="flex items-center gap-3">
          <Label htmlFor="html-mode">Encode mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as HtmlEncodeMode)}>
            <SelectTrigger id="html-mode" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal">Minimal (only &amp;&lt;&gt;&quot;&#39;)</SelectItem>
              <SelectItem value="named">Named entities</SelectItem>
              <SelectItem value="numeric">Numeric (&amp;#NN;)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      explanation={
        <>
          <p>
            HTML entity encoding replaces special characters with markup-safe references — either{' '}
            <em>named</em> (<code>&amp;amp;</code>) or <em>numeric</em> (<code>&amp;#38;</code>).
          </p>
          <p>
            Decoding restores the original characters. The minimum required for safe HTML embedding
            is escaping <code>&amp;</code>, <code>&lt;</code>, <code>&gt;</code>, <code>"</code>,
            and <code>'</code>.
          </p>
        </>
      }
    />
  )
}
