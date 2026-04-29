import { describe, expect, it } from 'vitest'
import { binaryToText, textToBinary } from '@/lib/encoders/binary'
import {
  asciiDecToText,
  asciiHexToText,
  textToAsciiDec,
  textToAsciiHex,
} from '@/lib/encoders/ascii'
import { hexToText, textToHex } from '@/lib/encoders/hex'
import { base64ToText, textToBase64 } from '@/lib/encoders/base64'
import { base32ToText, textToBase32 } from '@/lib/encoders/base32'
import { urlDecode, urlEncode } from '@/lib/encoders/url'
import { htmlDecode, htmlEncode } from '@/lib/encoders/html'
import { morseToText, textToMorse } from '@/lib/encoders/morse'
import { rot } from '@/lib/encoders/rot'

describe('binary', () => {
  it('encodes "Hi"', () => {
    expect(textToBinary('Hi')).toBe('01001000 01101001')
  })
  it('round-trips ASCII and emoji', () => {
    for (const t of ['', 'hello', 'Hello, world!', '🙂🚀 42', 'mixed café']) {
      expect(binaryToText(textToBinary(t))).toBe(t)
    }
  })
  it('rejects garbage', () => {
    expect(() => binaryToText('0102')).toThrow()
    expect(() => binaryToText('0101010')).toThrow() // not multiple of 8
  })
})

describe('ascii', () => {
  it('decimal and hex match for ABC', () => {
    expect(textToAsciiDec('ABC')).toBe('65 66 67')
    expect(textToAsciiHex('ABC')).toBe('41 42 43')
  })
  it('handles emoji code point', () => {
    expect(textToAsciiHex('🙂')).toBe('1F642')
    expect(asciiHexToText('1F642')).toBe('🙂')
  })
  it('round-trips both modes', () => {
    for (const t of ['hello', 'A B C', '🙂🌍']) {
      expect(asciiDecToText(textToAsciiDec(t))).toBe(t)
      expect(asciiHexToText(textToAsciiHex(t))).toBe(t)
    }
  })
})

describe('hex', () => {
  it('encodes "Hi"', () => {
    expect(textToHex('Hi')).toBe('48 69')
  })
  it('round-trips and accepts ws/colons/0x', () => {
    expect(hexToText('0x48 0x69')).toBe('Hi')
    expect(hexToText('48:69')).toBe('Hi')
    expect(hexToText('4869')).toBe('Hi')
  })
  it('rejects odd length', () => {
    expect(() => hexToText('1')).toThrow()
  })
})

describe('base64', () => {
  it('encodes "Many hands make light work."', () => {
    expect(textToBase64('Many hands make light work.')).toBe(
      'TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu',
    )
  })
  it('round-trips standard and URL-safe', () => {
    for (const t of ['', 'a', 'ab', 'abc', 'Hello, world! 🚀', '???']) {
      expect(base64ToText(textToBase64(t))).toBe(t)
      expect(base64ToText(textToBase64(t, true), true)).toBe(t)
    }
  })
  it('decodes either alphabet without explicit flag', () => {
    expect(base64ToText('Pz8_')).toBe('???')
  })
})

describe('base32', () => {
  it('encodes "foobar"', () => {
    expect(textToBase32('foobar')).toBe('MZXW6YTBOI======')
  })
  it('round-trips', () => {
    for (const t of ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar', 'Hello, 🌍']) {
      expect(base32ToText(textToBase32(t))).toBe(t)
    }
  })
  it('rejects invalid chars', () => {
    expect(() => base32ToText('ABCD0EFG')).toThrow()
  })
})

describe('url', () => {
  it('encodes a sentence with spaces and ampersand', () => {
    expect(urlEncode('hello world & more')).toBe('hello%20world%20%26%20more')
  })
  it('round-trips', () => {
    for (const t of ['', 'simple', 'a b?c=1&d=2', 'x://y/z?q=ä']) {
      expect(urlDecode(urlEncode(t))).toBe(t)
    }
  })
  it('rejects malformed percent', () => {
    expect(() => urlDecode('%E0%A4')).toThrow()
  })
})

describe('html', () => {
  it('escapes mandatory chars in minimal mode', () => {
    expect(htmlEncode('<a href="x" >&', 'minimal')).toBe('&lt;a href=&quot;x&quot; &gt;&amp;')
  })
  it('uses named entities', () => {
    expect(htmlEncode('A & B © 2025', 'named')).toBe('A &amp; B &copy; 2025')
  })
  it('falls back to numeric when no name', () => {
    expect(htmlEncode('☃', 'named')).toBe('&#9731;')
    expect(htmlEncode('☃', 'numeric')).toBe('&#9731;')
  })
  it('decodes named, decimal, and hex', () => {
    expect(htmlDecode('&amp; &#65; &#x41;')).toBe('& A A')
  })
})

describe('morse', () => {
  it('encodes a sentence', () => {
    expect(textToMorse('SOS')).toBe('... --- ...')
    expect(textToMorse('HELLO WORLD')).toBe(
      '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    )
  })
  it('round-trips upper/lower as upper', () => {
    expect(morseToText(textToMorse('hello world'))).toBe('HELLO WORLD')
  })
  it('rejects unknown code', () => {
    expect(() => morseToText('....----.')).toThrow()
  })
})

describe('rot', () => {
  it('Caesar shift 3: HELLO -> KHOOR', () => {
    expect(rot('HELLO', 3)).toBe('KHOOR')
  })
  it('ROT13 is involutive', () => {
    expect(rot(rot('Hello, world!', 13), 13)).toBe('Hello, world!')
  })
  it('shift 0 leaves text unchanged', () => {
    expect(rot('abc XYZ 123', 0)).toBe('abc XYZ 123')
  })
})
