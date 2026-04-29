import { EncoderTool } from '@/components/common/EncoderTool'
import { getToolById } from '@/data/tools'
import { urlDecode, urlEncode } from '@/lib/encoders/url'

export function UrlTool() {
  const tool = getToolById('url')!
  return (
    <EncoderTool
      tool={tool}
      encode={urlEncode}
      decode={urlDecode}
      encodedLabel="Percent-encoded"
      encodedPlaceholder="hello%20world%21%20%E2%9C%85"
      explanation={
        <>
          <p>
            Percent-encoding (a.k.a. URL encoding) replaces every byte that isn't an{' '}
            <em>unreserved</em> character with <code>%</code> followed by two hex digits.
          </p>
          <p>
            <code>encodeURIComponent</code> is what's used here, so reserved URL characters like{' '}
            <code>?</code>, <code>&amp;</code>, and <code>=</code> are escaped — not just spaces.
          </p>
        </>
      }
    />
  )
}
