import { EncoderTool } from '@/components/common/EncoderTool'
import { getToolById } from '@/data/tools'
import { base32ToText, textToBase32 } from '@/lib/encoders/base32'

export function Base32Tool() {
  const tool = getToolById('base32')!
  return (
    <EncoderTool
      tool={tool}
      encode={textToBase32}
      decode={base32ToText}
      encodedLabel="Base32 (RFC 4648)"
      encodedPlaceholder="JBSWY3DPEBLW64TMMQQQ===="
      explanation={
        <>
          <p>
            Base32 packs 5 bytes (40 bits) into 8 characters drawn from the alphabet{' '}
            <code>A–Z 2–7</code>. Easier to type and read aloud than Base64 — the alphabet avoids
            visually-similar characters like 0 and O.
          </p>
          <p>
            Common in TOTP/HOTP secrets (Google Authenticator etc.) because the input is meant to
            be transcribed by humans.
          </p>
        </>
      }
    />
  )
}
