import {
  CROP_VIEWPORT,
  type CropState,
  type ImageSize,
  INITIAL_CROP,
  MAX_ZOOM,
  clampCrop,
  scaleOf,
} from './crop'
import { type RefObject, useRef, useState } from 'react'

type CropEditorProps = {
  src: string
  imageRef: RefObject<HTMLImageElement | null>
  onChange: (crop: CropState) => void
}

/** Quanto cada seta do teclado move a imagem, em pixels. */
const ARROW_STEP = 12

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -ARROW_STEP, y: 0 },
  ArrowRight: { x: ARROW_STEP, y: 0 },
  ArrowUp: { x: 0, y: -ARROW_STEP },
  ArrowDown: { x: 0, y: ARROW_STEP },
}

/**
 * Recorte 1:1: arrastar (ou as setas) move a imagem, a barra aproxima. O círculo mostra como a foto aparece em avatar; o
 * quadrado inteiro é o que vai para o servidor.
 */
export const CropEditor = ({ src, imageRef, onChange }: CropEditorProps) => {
  const [size, setSize] = useState<ImageSize | null>(null)
  const [crop, setCrop] = useState(INITIAL_CROP)
  const drag = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null)

  const update = (next: CropState) => {
    if (!size) return
    const clamped = clampCrop(size, next)
    setCrop(clamped)
    onChange(clamped)
  }

  const scale = size ? scaleOf(size, crop.zoom) : 1

  return (
    <div className="flex flex-col items-center gap-(--space-12)">
      <div
        role="group"
        tabIndex={0}
        aria-label="Área do recorte. Use as setas para mover a imagem."
        className="relative cursor-move touch-none overflow-hidden rounded-(--radius-sm) bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
        style={{ width: CROP_VIEWPORT, height: CROP_VIEWPORT, maxWidth: '100%' }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { pointerX: event.clientX, pointerY: event.clientY, x: crop.x, y: crop.y }
        }}
        onPointerMove={(event) => {
          if (!drag.current) return
          update({
            ...crop,
            x: drag.current.x + event.clientX - drag.current.pointerX,
            y: drag.current.y + event.clientY - drag.current.pointerY,
          })
        }}
        onPointerUp={() => (drag.current = null)}
        onKeyDown={(event) => {
          const step = ARROWS[event.key]
          if (!step) return
          event.preventDefault()
          update({ ...crop, x: crop.x + step.x, y: crop.y + step.y })
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={(event) =>
            setSize({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
          className="absolute top-1/2 left-1/2 max-w-none select-none"
          style={
            size
              ? {
                  width: size.width * scale,
                  height: size.height * scale,
                  transform: `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px))`,
                }
              : { visibility: 'hidden' }
          }
        />
        {/* Fora do círculo escurece: é a pré-visualização de como a foto aparece redonda. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_200px_rgb(0_0_0/0.45)] outline-2 outline-white/80"
        />
      </div>

      <label className="type-label flex min-h-(--size-touch-min) w-full max-w-70 items-center gap-(--space-12) text-(--text-body)">
        Zoom
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          onChange={(event) => update({ ...crop, zoom: Number(event.target.value) })}
          className="h-11 min-w-0 flex-1 accent-(--action-primary)"
        />
      </label>
    </div>
  )
}
