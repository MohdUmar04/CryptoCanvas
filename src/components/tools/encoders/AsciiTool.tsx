import { useState } from 'react'
import { EncoderTool } from '@/components/common/EncoderTool'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getToolById } from '@/data/tools'
import {
  asciiDecToText,
  asciiHexToText,
  textToAsciiDec,
  textToAsciiHex,
} from '@/lib/encoders/ascii'

export function AsciiTool() {
  const tool = getToolById('ascii')!
  const [hex, setHex] = useState(false)

  return (
    <EncoderTool
      tool={tool}
      encode={hex ? textToAsciiHex : textToAsciiDec}
      decode={hex ? asciiHexToText : asciiDecToText}
      optionsKey={hex ? 'hex' : 'dec'}
      encodedLabel={hex ? 'Code points (hex)' : 'Code points (decimal)'}
      encodedPlaceholder={hex ? '48 65 6C 6C 6F' : '72 101 108 108 111'}
      options={
        <div className="flex items-center gap-2">
          <Switch id="ascii-hex" checked={hex} onCheckedChange={setHex} />
          <Label htmlFor="ascii-hex">Show as hex</Label>
          <p className="text-xs text-muted-foreground">
            Each token is a single Unicode code point.
          </p>
        </div>
      }
      explanation={
        <>
          <p>
            ASCII originally covered 0–127 (the first 128 Unicode code points). This tool extends
            naturally to all of Unicode: each character becomes its <em>code point</em>.
          </p>
          <p>
            "A" → 65 (decimal) / 41 (hex). Emoji like "🙂" sit far above the ASCII range — code
            point 128578 / 0x1F642.
          </p>
        </>
      }
    />
  )
}
