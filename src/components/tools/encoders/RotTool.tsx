import { useState } from 'react'
import { EncoderTool } from '@/components/common/EncoderTool'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { getToolById } from '@/data/tools'
import { rot } from '@/lib/encoders/rot'

export function RotTool() {
  const tool = getToolById('rot')!
  const [shift, setShift] = useState(13)

  return (
    <EncoderTool
      tool={tool}
      encode={(t) => rot(t, shift)}
      decode={(t) => rot(t, -shift)}
      optionsKey={String(shift)}
      encodedLabel={`ROT-${shift}${shift === 13 ? ' (classic)' : ''}`}
      encodedPlaceholder="Uryyb, jbeyq!"
      options={
        <div className="flex w-full items-center gap-4 sm:w-80">
          <Label htmlFor="rot-shift" className="shrink-0">
            Shift: {shift}
          </Label>
          <Slider
            id="rot-shift"
            min={0}
            max={25}
            step={1}
            value={[shift]}
            onValueChange={(v) => setShift(v[0])}
            className="flex-1"
          />
        </div>
      }
      explanation={
        <>
          <p>
            ROT-N rotates each letter forward by N positions in the alphabet, wrapping past Z back
            to A. Non-letters are left untouched. Case is preserved.
          </p>
          <p>
            <strong>ROT13</strong> is its own inverse (because 13 + 13 = 26), so applying it twice
            gets you back the original text.
          </p>
        </>
      }
    />
  )
}
