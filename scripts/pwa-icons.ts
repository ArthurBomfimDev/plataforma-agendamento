/**
 * Gera os ícones do PWA a partir do símbolo da marca (`frontend/src/assets/images/vagoo_icone_escuro.png`, o tile
 * escuro de docs/design/marca-vagoo.md). Sem biblioteca de imagem: decodifica o PNG, recorta o miolo do tile (sem a borda
 * azul e sem os cantos arredondados) e redimensiona por média de bloco.
 *
 *   bun scripts/pwa-icons.ts
 *
 * Saída em `frontend/public/icons/` (versionada: o build não depende deste script):
 *   icon-192.png, icon-512.png            "any": o miolo ocupa o quadrado inteiro
 *   icon-maskable-512.png                 "maskable": miolo a 66% sobre cor lisa, dentro da zona segura de 80%
 *
 * O `apple-touch-icon` continua sendo o `vagoo-favicon-180.png` que o `index.html` já empacota.
 *
 * Determinístico: a mesma entrada gera os mesmos bytes.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { encodePng } from './seed-demo/png'

const ROOT = join(import.meta.dir, '..')
const SOURCE = join(ROOT, 'frontend', 'src', 'assets', 'images', 'vagoo_icone_escuro.png')
const OUT = join(ROOT, 'frontend', 'public', 'icons')

export type Rgba = { width: number; height: number; data: Uint8Array }

/** PNG de 8 bits, RGB ou RGBA, sem entrelaçamento: o que a marca exporta. */
export function decodePng(bytes: Uint8Array): Rgba {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 8
  let width = 0
  let height = 0
  let channels = 0
  const parts: Uint8Array[] = []

  while (offset < bytes.length) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8))
    const body = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8)
      height = view.getUint32(offset + 12)
      const depth = body[8]
      const colorType = body[9]
      if (depth !== 8 || (colorType !== 2 && colorType !== 6) || body[12] !== 0) {
        throw new Error('Só PNG RGB/RGBA de 8 bits sem entrelaçamento')
      }
      channels = colorType === 6 ? 4 : 3
    }
    if (type === 'IDAT') parts.push(body)
    offset += 12 + length
  }

  const raw = inflateSync(Buffer.concat(parts))
  const stride = width * channels
  const out = new Uint8Array(width * height * 4)
  const previous = new Uint8Array(stride)
  const line = new Uint8Array(stride)

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!
    line.set(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? line[i - channels]! : 0
      const up = previous[i]!
      const upLeft = i >= channels ? previous[i - channels]! : 0
      let add = 0
      if (filter === 1) add = left
      else if (filter === 2) add = up
      else if (filter === 3) add = (left + up) >> 1
      else if (filter === 4) {
        const p = left + up - upLeft
        const pa = Math.abs(p - left)
        const pb = Math.abs(p - up)
        const pc = Math.abs(p - upLeft)
        add = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft
      }
      line[i] = (line[i]! + add) & 0xff
    }
    previous.set(line)
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4
      out[at] = line[x * channels]!
      out[at + 1] = line[x * channels + 1]!
      out[at + 2] = line[x * channels + 2]!
      out[at + 3] = channels === 4 ? line[x * channels + 3]! : 255
    }
  }
  return { width, height, data: out }
}

/** Menor retângulo com pixels visíveis (alfa acima de 128). */
export function opaqueBounds({ width, height, data }: Rgba) {
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! > 128) {
        left = Math.min(left, x)
        right = Math.max(right, x)
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
      }
    }
  }
  return { x: left, y: top, size: Math.min(right - left + 1, bottom - top + 1) }
}

/** Média de cada bloco da origem que cai no pixel de destino. Devolve RGB. */
export function resizeSquare(source: Rgba, x0: number, y0: number, side: number, target: number): Uint8Array {
  const out = new Uint8Array(target * target * 3)
  const ratio = side / target
  for (let ty = 0; ty < target; ty++) {
    for (let tx = 0; tx < target; tx++) {
      const sx0 = Math.floor(x0 + tx * ratio)
      const sx1 = Math.max(sx0 + 1, Math.floor(x0 + (tx + 1) * ratio))
      const sy0 = Math.floor(y0 + ty * ratio)
      const sy1 = Math.max(sy0 + 1, Math.floor(y0 + (ty + 1) * ratio))
      let r = 0
      let g = 0
      let b = 0
      let count = 0
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const at = (sy * source.width + sx) * 4
          r += source.data[at]!
          g += source.data[at + 1]!
          b += source.data[at + 2]!
          count++
        }
      }
      const to = (ty * target + tx) * 3
      out[to] = Math.round(r / count)
      out[to + 1] = Math.round(g / count)
      out[to + 2] = Math.round(b / count)
    }
  }
  return out
}

/** Cor média dos quatro cantos do recorte: é o fundo liso do ícone maskable. */
function cornerColor(source: Rgba, x0: number, y0: number, side: number): [number, number, number] {
  const patch = 8
  const sum = [0, 0, 0]
  let count = 0
  for (const [cx, cy] of [
    [x0, y0],
    [x0 + side - patch, y0],
    [x0, y0 + side - patch],
    [x0 + side - patch, y0 + side - patch],
  ] as const) {
    for (let y = cy; y < cy + patch; y++) {
      for (let x = cx; x < cx + patch; x++) {
        const at = (y * source.width + x) * 4
        sum[0]! += source.data[at]!
        sum[1]! += source.data[at + 1]!
        sum[2]! += source.data[at + 2]!
        count++
      }
    }
  }
  return [Math.round(sum[0]! / count), Math.round(sum[1]! / count), Math.round(sum[2]! / count)]
}

export function buildIcons(source: Rgba) {
  const tile = opaqueBounds(source)
  // Tira 8% de cada lado: some a borda azul e os cantos arredondados do tile.
  const inset = Math.round(tile.size * 0.08)
  const x0 = tile.x + inset
  const y0 = tile.y + inset
  const side = tile.size - inset * 2
  const background = cornerColor(source, x0, y0, side)

  const any = (size: number) => encodePng(size, size, resizeSquare(source, x0, y0, side, size))

  const maskable = (size: number) => {
    const inner = Math.round(size * 0.66)
    const pixels = new Uint8Array(size * size * 3)
    for (let i = 0; i < size * size; i++) pixels.set(background, i * 3)
    const scaled = resizeSquare(source, x0, y0, side, inner)
    const offset = Math.round((size - inner) / 2)
    // Borda esfumada nos 14% externos do miolo: o centro do tile é mais claro que o canto, e sem isto o quadrado aparece.
    const feather = inner * 0.14
    for (let y = 0; y < inner; y++) {
      for (let x = 0; x < inner; x++) {
        const edge = Math.min(x, y, inner - 1 - x, inner - 1 - y)
        const weight = Math.min(1, edge / feather)
        const from = (y * inner + x) * 3
        const to = ((y + offset) * size + x + offset) * 3
        for (let c = 0; c < 3; c++) pixels[to + c] = Math.round(background[c]! + (scaled[from + c]! - background[c]!) * weight)
      }
    }
    return encodePng(size, size, pixels)
  }

  return {
    'icon-192.png': any(192),
    'icon-512.png': any(512),
    'icon-maskable-512.png': maskable(512),
  }
}

if (import.meta.main) {
  const icons = buildIcons(decodePng(readFileSync(SOURCE)))
  mkdirSync(OUT, { recursive: true })
  for (const [name, bytes] of Object.entries(icons)) {
    writeFileSync(join(OUT, name), bytes)
    console.log(`  ${name}  ${bytes.length} bytes`)
  }
}
