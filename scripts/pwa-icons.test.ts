/** `bun test scripts` */
import { describe, expect, test } from 'bun:test'
import { buildIcons, decodePng, opaqueBounds } from './pwa-icons'
import { encodePng } from './seed-demo/png'

/** RGBA 8 bits sem entrelaçamento, com o filtro "Sub" na primeira linha, para exercitar o desfiltro. */
const rgbaPng = (width: number, height: number, pixel: (x: number, y: number) => number[]) => {
  const { deflateSync } = require('node:zlib') as typeof import('node:zlib')
  const raw = new Uint8Array((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    for (let x = 0; x < width; x++) raw.set(pixel(x, y), y * (width * 4 + 1) + 1 + x * 4)
  }
  const header = new Uint8Array(13)
  const view = new DataView(header.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  header[8] = 8
  header[9] = 6
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length)
    new DataView(out.buffer).setUint32(0, data.length)
    for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
    out.set(data, 8)
    return out
  }
  const parts = [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array(0))]
  return Buffer.concat(parts)
}

describe('decodePng', () => {
  test('lê o que o gerador de PNG escreve (RGB)', () => {
    const rgb = Uint8Array.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 10, 20, 30])
    const decoded = decodePng(encodePng(2, 2, rgb))

    expect([decoded.width, decoded.height]).toEqual([2, 2])
    expect([...decoded.data]).toEqual([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 10, 20, 30, 255])
  })

  test('lê RGBA e recusa o que não suporta', () => {
    const decoded = decodePng(rgbaPng(2, 1, (x) => [x * 100, 1, 2, 200]))
    expect([...decoded.data]).toEqual([0, 1, 2, 200, 100, 1, 2, 200])

    const palette = Buffer.from(rgbaPng(1, 1, () => [0, 0, 0, 255]))
    palette[25] = 3 // tipo de cor "paleta"
    expect(() => decodePng(palette)).toThrow()
  })
})

describe('ícones', () => {
  test('o retângulo opaco ignora a margem transparente', () => {
    const image = decodePng(rgbaPng(10, 10, (x, y) => (x >= 2 && x < 8 && y >= 3 && y < 9 ? [9, 9, 9, 255] : [0, 0, 0, 0])))
    expect(opaqueBounds(image)).toEqual({ x: 2, y: 3, size: 6 })
  })

  test('gera 192, 512 e o maskable 512, com os tamanhos certos e determinísticos', () => {
    const source = decodePng(rgbaPng(100, 100, (x, y) => (x >= 10 && x < 90 && y >= 10 && y < 90 ? [20, 40, 80, 255] : [0, 0, 0, 0])))
    const icons = buildIcons(source)
    const size = (name: keyof typeof icons) => {
      const bytes = icons[name]
      return `${new DataView(bytes.buffer, bytes.byteOffset).getUint32(16)}x${new DataView(bytes.buffer, bytes.byteOffset).getUint32(20)}`
    }

    expect(Object.keys(icons)).toEqual(['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'])
    expect(size('icon-192.png')).toBe('192x192')
    expect(size('icon-512.png')).toBe('512x512')
    expect(size('icon-maskable-512.png')).toBe('512x512')
    expect(buildIcons(source)['icon-192.png']).toEqual(icons['icon-192.png'])
  })
})
