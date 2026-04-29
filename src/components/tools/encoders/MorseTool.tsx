import { Pause, Play } from 'lucide-react'
import { useRef, useState } from 'react'
import { EncoderTool } from '@/components/common/EncoderTool'
import { Button } from '@/components/ui/button'
import { getToolById } from '@/data/tools'
import { morseToText, textToMorse } from '@/lib/encoders/morse'

const DOT = 90 // ms
const DASH = DOT * 3
const GAP = DOT
const LETTER_GAP = DOT * 3
const WORD_GAP = DOT * 7
const FREQ = 600

async function playMorse(morse: string, signal: AbortSignal) {
  const Ctor =
    typeof window !== 'undefined'
      ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined
  if (!Ctor) return
  const ctx = new Ctor()
  const tone = (durationMs: number) =>
    new Promise<void>((resolve) => {
      if (signal.aborted) return resolve()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = FREQ
      osc.connect(gain)
      gain.connect(ctx.destination)
      const now = ctx.currentTime
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.005)
      gain.gain.linearRampToValueAtTime(0, now + durationMs / 1000)
      osc.start(now)
      osc.stop(now + durationMs / 1000 + 0.01)
      const t = setTimeout(resolve, durationMs)
      signal.addEventListener('abort', () => {
        clearTimeout(t)
        try {
          osc.stop()
        } catch {
          // ignore
        }
        resolve()
      }, { once: true })
    })
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = setTimeout(resolve, ms)
      signal.addEventListener('abort', () => {
        clearTimeout(t)
        resolve()
      }, { once: true })
    })

  const tokens = morse.split(' ')
  for (let i = 0; i < tokens.length; i++) {
    if (signal.aborted) break
    const tok = tokens[i]
    if (tok === '/') {
      await wait(WORD_GAP - LETTER_GAP)
      continue
    }
    for (let j = 0; j < tok.length; j++) {
      if (signal.aborted) break
      await tone(tok[j] === '-' ? DASH : DOT)
      if (j < tok.length - 1) await wait(GAP)
    }
    if (i < tokens.length - 1) await wait(LETTER_GAP)
  }
  try {
    await ctx.close()
  } catch {
    // ignore
  }
}

export function MorseTool() {
  const tool = getToolById('morse')!
  const [morse, setMorse] = useState('')
  const [playing, setPlaying] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const onPlayToggle = async () => {
    if (playing) {
      abortRef.current?.abort()
      setPlaying(false)
      return
    }
    if (!morse.trim()) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setPlaying(true)
    try {
      await playMorse(morse, ctrl.signal)
    } finally {
      setPlaying(false)
    }
  }

  return (
    <EncoderTool
      tool={tool}
      encode={(t) => {
        const m = textToMorse(t)
        setMorse(m)
        return m
      }}
      decode={(m) => {
        setMorse(m)
        return morseToText(m)
      }}
      encodedLabel="Morse"
      encodedPlaceholder=".... . .-.. .-.. --- / .-- --- .-. .-.. -.."
      options={
        <Button onClick={onPlayToggle} variant="outline" size="sm" disabled={!morse.trim()}>
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? 'Stop' : 'Play audio'}
        </Button>
      }
      explanation={
        <>
          <p>
            Morse code maps letters and digits to sequences of dots and dashes — the dot is the
            shortest unit, and a dash is three units long. Letters within a word are separated by a
            single space; words by a slash.
          </p>
          <p>
            The audio button uses the Web Audio API to play a 600 Hz tone with classic timing
            ratios.
          </p>
        </>
      }
    />
  )
}
