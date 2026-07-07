# CryptoCanvas

A frontend-only sandbox for **seeing how cryptography actually works**. Encoding, hashing, and encryption tend to blur together when you only meet them as library calls — CryptoCanvas lets you run each one on your own input, step by step, including the moments where things *fail* (wrong key, tampered ciphertext, bad signature).

Everything runs in the browser. No backend, no analytics, no telemetry.

> ⚠️ **Educational use only.** This is not a security product and the code is not professionally audited. Browsers don't isolate keys the way HSMs do — **don't paste real secrets into it.**

## Tools

**Encoding** — Binary · ASCII · Hexadecimal · Base64 (standard & URL-safe) · Base32 · URL · HTML entities · Morse · ROT-N

**Time & Dates** — Time Converter (epoch ↔ ISO 8601 ↔ local, unit auto-detect, world clock) · UUID Inspector (version/variant decode, embedded v1/v7 timestamps, v4/v7 generation)

**Classical Ciphers** — Caesar (with alphabet wheel + frequency-analysis auto-solver) · Vigenère (with Kasiski/Friedman key recovery) · XOR

**Hashing** — Hash (MD5, SHA-1/256/384/512, with an interactive avalanche demo) · HMAC · Password Hashing (PBKDF2 & scrypt with a live work-factor timer)

**Symmetric** — AES-GCM & AES-CBC (128/192/256) with round visualization and tamper panel

**Asymmetric** — RSA (OAEP encrypt/decrypt, PSS sign/verify, plus a "toy numbers" panel showing the real modular arithmetic) · ECDSA (P-256) · Diffie–Hellman key-exchange walkthrough

**Tokens** — JWT · JWS · JWE · Nested JWT (sign-then-encrypt)

**Generators** — Symmetric keys, keypairs, and secure passwords

## Features

- **Command palette** — press <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> to fuzzy-search and jump to any tool.
- **Shareable URLs** — tool inputs are encoded in the query string; hit "Copy link" to share a specific example.
- **Format auto-detect** — paste something and CryptoCanvas suggests the right tool for it (UUID, JWT, epoch, hex, Base64, and more), carrying your input along.
- **Live feedback** — a green pulse on a verified signature or successful decryption, a red shake on tampering or a wrong key.
- **How-it-works explainers** and step-by-step animations on every tool.

## What runs where

- **Web Crypto API** — AES, RSA, ECDSA, SHA-\*, HMAC, PBKDF2
- [`jose`](https://github.com/panva/jose) — JWT / JWS / JWE
- [`@noble/*`](https://github.com/paulmillr/noble-hashes) — MD5, scrypt, and other primitives the platform doesn't expose

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Radix UI · Motion · React Router (hash routing, so it deploys to any static host).

## Development

```bash
npm install
npm run dev        # start the dev server
npm run build      # typecheck + production build
npm run test       # run the test suite (Vitest)
npm run lint       # ESLint
npm run format     # Prettier
```

## Project structure

```
src/
  lib/           Pure crypto/encoding logic (framework-agnostic, fully unit-tested)
  components/
    tools/       One component per tool, grouped by category
    common/      Shared tool scaffolding (ToolShell, ToolPane, StepStrip, …)
    layout/      Navbar, sidebar, command palette, theme
    ui/          Radix-based primitives
  data/tools.ts  The tool registry that drives routing, sidebar, and search
  pages/         Home, tool page (lazy-loaded), about, 404
  tests/         Vitest specs mirroring src/lib
```

Each tool's logic lives in `src/lib/` as pure functions with their own tests, so the UI layer stays thin and the crypto stays verifiable.
