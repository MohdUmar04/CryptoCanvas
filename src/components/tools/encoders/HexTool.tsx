import { EncoderTool } from '@/components/common/EncoderTool'
import { getToolById } from '@/data/tools'
import { hexToText, textToHex } from '@/lib/encoders/hex'

export function HexTool() {
  const tool = getToolById('hex')!
  return (
    <EncoderTool
      tool={tool}
      encode={textToHex}
      decode={hexToText}
      encodedLabel="Hex bytes"
      encodedPlaceholder="48 65 6c 6c 6f"
      explanation={
        <>
          <p>
            Hexadecimal is base 16. Every UTF-8 <em>byte</em> of your text becomes two hex digits
            (one digit per nibble).
          </p>
          <p>
            Decoding accepts whitespace, colons, or <code>0x</code> prefixes — they're stripped
            before parsing.
          </p>
        </>
      }
    />
  )
}
