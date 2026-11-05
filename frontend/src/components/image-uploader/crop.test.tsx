import { CROP_VIEWPORT, INITIAL_CROP, clampCrop, cropRect, scaleOf } from './crop'
import { describe, expect, it } from 'vitest'

import { CropEditor } from './crop-editor'
import { createRef } from 'react'
import { renderToString } from 'react-dom/server'

const WIDE = { width: 1000, height: 500 }

describe('recorte 1:1', () => {
  it('sem ajuste, pega o quadrado central no lado menor', () => {
    const rect = cropRect(WIDE, INITIAL_CROP)

    expect(rect.x).toBeCloseTo(250)
    expect(rect.y).toBeCloseTo(0)
    expect(rect.size).toBeCloseTo(500)
  })

  it('o zoom reduz o quadrado, mantendo o centro', () => {
    const rect = cropRect(WIDE, { zoom: 2, x: 0, y: 0 })

    expect(rect.x).toBeCloseTo(375)
    expect(rect.y).toBeCloseTo(125)
    expect(rect.size).toBeCloseTo(250)
  })

  it('mover para a direita mostra o lado esquerdo da imagem', () => {
    const scale = scaleOf(WIDE, 1)
    expect(cropRect(WIDE, { zoom: 1, x: 100 * scale, y: 0 }).x).toBeCloseTo(150)
  })

  it('nunca deixa área vazia: o deslocamento para na borda', () => {
    const limit = (WIDE.width * scaleOf(WIDE, 1) - CROP_VIEWPORT) / 2

    expect(clampCrop(WIDE, { zoom: 1, x: 9_999, y: 9_999 })).toEqual({ zoom: 1, x: limit, y: 0 })
    expect(cropRect(WIDE, clampCrop(WIDE, { zoom: 1, x: 9_999, y: 0 })).x).toBeCloseTo(0)
  })

  it('o zoom fica entre 1 e 3', () => {
    expect(clampCrop(WIDE, { zoom: 0.2, x: 0, y: 0 }).zoom).toBe(1)
    expect(clampCrop(WIDE, { zoom: 9, x: 0, y: 0 }).zoom).toBe(3)
  })

  it('o editor oferece mover pelo teclado e o zoom com rótulo', () => {
    const html = renderToString(
      <CropEditor src="blob:foto" imageRef={createRef()} onChange={() => undefined} />,
    )

    expect(html).toContain('Use as setas para mover')
    expect(html).toContain('Zoom')
    expect(html).toContain('type="range"')
  })
})
