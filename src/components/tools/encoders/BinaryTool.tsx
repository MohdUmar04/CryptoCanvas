import { EncoderTool } from '@/components/common/EncoderTool'
import { getToolById } from '@/data/tools'
import { binaryToText, textToBinary } from '@/lib/encoders/binary'

export function BinaryTool() {
  const tool = getToolById('binary')!
  return (
    <EncoderTool
      tool={tool}
      encode={textToBinary}
      decode={binaryToText}
      encodedLabel="Binary (8-bit groups)"
      encodedPlaceholder="01001000 01100101 01101100 01101100 01101111"
      explanation={
        <>
          <p>
            Binary representation maps each <code>UTF-8</code> byte of your text to its 8-bit form.
            "H" is byte <code>0x48</code> = <code>72</code> = <code>01001000</code>.
          </p>
          <p>
            Multi-byte characters (like emoji) take 2–4 bytes — each byte becomes its own group of 8
            bits. Spaces between groups are visual; they aren't part of the encoding.
          </p>
        </>
      }
    />
  )
}
