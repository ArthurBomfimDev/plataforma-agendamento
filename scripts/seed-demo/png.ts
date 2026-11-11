/**
 * Imagens ORIGINAIS da demonstração, geradas por código: composição de cor + iniciais ou silhueta. Nada vem de
 * banco de imagens, nada é baixado, e a mesma entrada produz sempre os mesmos bytes (sem aleatoriedade, sem relógio).
 * Só depende de `node:zlib`: nenhum pacote novo no repositório.
 */
import { deflateSync } from 'node:zlib'

export type TileKind = 'logo' | 'cover' | 'service' | 'professional'

/** Fonte 5×7 de A a Z. Cada linha é uma máscara de 5 bits. Acentos são removidos antes (`initialsOf`). */
const GLYPHS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
}

const GLYPH_COLUMNS = 5
const GLYPH_ROWS = 7

/** Até duas iniciais maiúsculas, sem acento, ignorando conectivos ("Estúdio Duartina" → "ED"). */
export function initialsOf(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^A-Za-z]+/)
    .filter((word) => word.length > 2 || /^[A-Z]/.test(word))
    .filter((word) => !['de', 'da', 'do', 'das', 'dos', 'e'].includes(word.toLowerCase()))
  const letters = words.slice(0, 2).map((word) => word[0]!.toUpperCase())
  return letters.length > 0 ? letters.join('') : 'V'
}

/** Matiz estável (0–359) para uma chave de texto: o mesmo nome tem sempre a mesma cor. */
export function hueOf(key: string): number {
  let hash = 2166136261
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash % 360
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

const mix = (from: number[], to: number[], amount: number): [number, number, number] => [
  Math.round(from[0]! + (to[0]! - from[0]!) * amount),
  Math.round(from[1]! + (to[1]! - from[1]!) * amount),
  Math.round(from[2]! + (to[2]! - from[2]!) * amount),
]

/** Ponto (0–1) dentro do texto centralizado? Devolve a cobertura do glifo naquele ponto. */
function textMask(text: string, u: number, v: number, heightFraction: number): boolean {
  const cell = heightFraction / GLYPH_ROWS
  const gap = cell
  const width = text.length * GLYPH_COLUMNS * cell + (text.length - 1) * gap
  const left = 0.5 - width / 2
  const top = 0.5 - heightFraction / 2
  if (v < top || v >= top + heightFraction || u < left || u >= left + width) return false

  const column = Math.floor((u - left) / cell)
  const perLetter = GLYPH_COLUMNS + 1
  const letterIndex = Math.floor(column / perLetter)
  const inLetter = column % perLetter
  if (inLetter >= GLYPH_COLUMNS) return false
  const glyph = GLYPHS[text[letterIndex]!]
  if (!glyph) return false
  const row = Math.floor((v - top) / cell)
  return glyph[row]?.[inLetter] === '1'
}

/** Pixels RGB (3 bytes por pixel) de um quadrado `size`×`size`. */
export function renderTilePixels(kind: TileKind, label: string, size = 512, hueKey = label): Uint8Array {
  const hue = hueOf(hueKey)
  const dark = hslToRgb(hue, 0.55, 0.34)
  const light = hslToRgb((hue + 28) % 360, 0.6, 0.6)
  const pale = hslToRgb(hue, 0.5, 0.88)
  const white: [number, number, number] = [255, 255, 255]
  const initials = initialsOf(label)
  const out = new Uint8Array(size * size * 3)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size
      const v = (y + 0.5) / size
      let color = mix(dark, light, (u + v) / 2)

      if (kind === 'cover') {
        // Faixas diagonais suaves: lembram uma fachada.
        if (Math.floor((u + v) * 7) % 2 === 0) color = mix(color, white, 0.08)
        if (textMask(initials, u, v, 0.22)) color = white
      } else if (kind === 'service') {
        // Anel e disco, como o fundo de um produto.
        const d = Math.hypot(u - 0.72, v - 0.3)
        if (d < 0.2 && d > 0.15) color = mix(color, white, 0.35)
        if (d <= 0.15) color = mix(color, white, 0.14)
        if (textMask(initials, u, v, 0.2)) color = white
      } else if (kind === 'professional') {
        // Silhueta: cabeça e ombros em tom claro.
        const head = Math.hypot(u - 0.5, v - 0.38) < 0.17
        const shoulders = ((u - 0.5) / 0.36) ** 2 + ((v - 1.02) / 0.4) ** 2 < 1
        if (head || shoulders) color = pale
      } else if (textMask(initials, u, v, 0.34)) {
        color = white
      }

      const at = (y * size + x) * 3
      out[at] = color[0]
      out[at + 1] = color[1]
      out[at + 2] = color[2]
    }
  }
  return out
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

/** PNG RGB de 8 bits, sem entrelaçamento. */
export function encodePng(width: number, height: number, rgb: Uint8Array): Uint8Array {
  const stride = width * 3
  const raw = new Uint8Array((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    raw.set(rgb.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1)
  }

  const header = new Uint8Array(13)
  const view = new DataView(header.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  header[8] = 8 // profundidade
  header[9] = 2 // RGB

  const parts = [
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

/** A imagem pronta para o envio: quadrada, como o recorte da interface entrega. */
export function renderTilePng(kind: TileKind, label: string, size = 512, hueKey = label): Uint8Array {
  return encodePng(size, size, renderTilePixels(kind, label, size, hueKey))
}
