import {
  Binary,
  Clock3,
  Code2,
  Braces,
  Crown,
  FileKey,
  FileType,
  Fingerprint,
  Globe,
  Hash,
  Key,
  KeyRound,
  KeySquare,
  Layers,
  Lock,
  RadioTower,
  RotateCw,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type ToolCategory =
  | 'encoders'
  | 'time'
  | 'ciphers'
  | 'hashing'
  | 'symmetric'
  | 'asymmetric'
  | 'tokens'
  | 'keygen'

export type Tool = {
  id: string
  route: string
  title: string
  blurb: string
  category: ToolCategory
  icon: LucideIcon
}

export const categoryOrder: ToolCategory[] = [
  'encoders',
  'time',
  'ciphers',
  'hashing',
  'symmetric',
  'asymmetric',
  'tokens',
  'keygen',
]

export const categories: Record<ToolCategory, { label: string; description: string }> = {
  encoders: {
    label: 'Encoding',
    description: 'Convert text between common representations',
  },
  time: {
    label: 'Time & Dates',
    description: 'Epoch timestamps and date formats',
  },
  ciphers: {
    label: 'Classical Ciphers',
    description: 'Hand-crafted ciphers from history',
  },
  hashing: {
    label: 'Hashing',
    description: 'One-way digests and message authentication',
  },
  symmetric: {
    label: 'Symmetric Encryption',
    description: 'AES — same key on both sides',
  },
  asymmetric: {
    label: 'Asymmetric Encryption',
    description: 'Public/private keypairs (RSA, ECDSA)',
  },
  tokens: {
    label: 'Tokens',
    description: 'JWT, JWS, JWE — modern web token formats',
  },
  keygen: {
    label: 'Generators',
    description: 'Random keys and passwords',
  },
}

export const tools: Tool[] = [
  // encoders
  {
    id: 'binary',
    route: '/tools/binary',
    title: 'Binary',
    blurb: 'Convert text to and from 0s and 1s.',
    category: 'encoders',
    icon: Binary,
  },
  {
    id: 'ascii',
    route: '/tools/ascii',
    title: 'ASCII',
    blurb: 'Decimal & hex code points per character.',
    category: 'encoders',
    icon: FileType,
  },
  {
    id: 'hex',
    route: '/tools/hex',
    title: 'Hexadecimal',
    blurb: 'UTF-8 byte view in hex.',
    category: 'encoders',
    icon: Hash,
  },
  {
    id: 'base64',
    route: '/tools/base64',
    title: 'Base64',
    blurb: 'Standard and URL-safe variants.',
    category: 'encoders',
    icon: Code2,
  },
  {
    id: 'base32',
    route: '/tools/base32',
    title: 'Base32',
    blurb: 'RFC 4648 alphabet.',
    category: 'encoders',
    icon: Code2,
  },
  {
    id: 'url',
    route: '/tools/url',
    title: 'URL Encode',
    blurb: 'Percent-encode unsafe characters.',
    category: 'encoders',
    icon: Globe,
  },
  {
    id: 'html',
    route: '/tools/html',
    title: 'HTML Entities',
    blurb: 'Named & numeric character references.',
    category: 'encoders',
    icon: Globe,
  },
  {
    id: 'morse',
    route: '/tools/morse',
    title: 'Morse Code',
    blurb: 'Translate to dots and dashes.',
    category: 'encoders',
    icon: RadioTower,
  },
  {
    id: 'rot',
    route: '/tools/rot',
    title: 'ROT-N',
    blurb: 'Live shift slider — including ROT13.',
    category: 'encoders',
    icon: RotateCw,
  },
  // time
  {
    id: 'time',
    route: '/tools/time',
    title: 'Time Converter',
    blurb: 'Epoch ↔ ISO 8601 ↔ local — with unit auto-detect and a world clock.',
    category: 'time',
    icon: Clock3,
  },
  {
    id: 'uuid',
    route: '/tools/uuid',
    title: 'UUID Inspector',
    blurb: 'Decode version, variant & embedded timestamps — and generate v4/v7.',
    category: 'time',
    icon: Braces,
  },
  // ciphers
  {
    id: 'caesar',
    route: '/tools/caesar',
    title: 'Caesar Cipher',
    blurb: 'Shift letters by a fixed amount, with an animated wheel.',
    category: 'ciphers',
    icon: Crown,
  },
  {
    id: 'vigenere',
    route: '/tools/vigenere',
    title: 'Vigenère',
    blurb: 'A keyword expands the shift across the message.',
    category: 'ciphers',
    icon: Sparkles,
  },
  {
    id: 'xor',
    route: '/tools/xor',
    title: 'XOR Cipher',
    blurb: 'Byte-level XOR with a repeating key.',
    category: 'ciphers',
    icon: Code2,
  },
  // hashing
  {
    id: 'hash',
    route: '/tools/hash',
    title: 'Hash',
    blurb: 'MD5 plus SHA-1, 256, 384, 512.',
    category: 'hashing',
    icon: Fingerprint,
  },
  {
    id: 'hmac',
    route: '/tools/hmac',
    title: 'HMAC',
    blurb: 'Keyed-hash message authentication.',
    category: 'hashing',
    icon: Shield,
  },
  {
    id: 'kdf',
    route: '/tools/kdf',
    title: 'Password Hashing',
    blurb: 'PBKDF2 & scrypt with a live work-factor timer.',
    category: 'hashing',
    icon: KeySquare,
  },
  // symmetric
  {
    id: 'aes',
    route: '/tools/aes',
    title: 'AES',
    blurb: 'AES-GCM (recommended) and AES-CBC, 128/192/256.',
    category: 'symmetric',
    icon: Lock,
  },
  // asymmetric
  {
    id: 'rsa',
    route: '/tools/rsa',
    title: 'RSA',
    blurb: 'OAEP encrypt/decrypt and PSS sign/verify.',
    category: 'asymmetric',
    icon: KeyRound,
  },
  {
    id: 'ecdsa',
    route: '/tools/ecdsa',
    title: 'ECDSA',
    blurb: 'P-256 sign and verify.',
    category: 'asymmetric',
    icon: FileKey,
  },
  {
    id: 'dh',
    route: '/tools/dh',
    title: 'Diffie–Hellman',
    blurb: 'Watch two parties derive a shared secret over a public channel.',
    category: 'asymmetric',
    icon: Users,
  },
  // tokens
  {
    id: 'jwt',
    route: '/tools/jwt',
    title: 'JWT',
    blurb: 'Sign and verify JSON claims (RFC 7519 — JWS with JSON inside).',
    category: 'tokens',
    icon: Key,
  },
  {
    id: 'jws',
    route: '/tools/jws',
    title: 'JWS',
    blurb: "JWT's underlying primitive — sign arbitrary bytes (RFC 7515).",
    category: 'tokens',
    icon: Key,
  },
  {
    id: 'jwe',
    route: '/tools/jwe',
    title: 'JWE',
    blurb: 'Encrypt arbitrary content for one recipient (RFC 7516).',
    category: 'tokens',
    icon: Lock,
  },
  {
    id: 'nested',
    route: '/tools/nested',
    title: 'Nested JWT',
    blurb: 'Sign then encrypt — confidential, tamper-proof claims (RFC 7519 §11.2).',
    category: 'tokens',
    icon: Layers,
  },
  // keygen
  {
    id: 'keygen',
    route: '/tools/keygen',
    title: 'Key Generator',
    blurb: 'Symmetric keys, keypairs, and secure passwords.',
    category: 'keygen',
    icon: KeyRound,
  },
]

export function getToolById(id: string | undefined): Tool | undefined {
  if (!id) return undefined
  return tools.find((t) => t.id === id)
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category)
}
