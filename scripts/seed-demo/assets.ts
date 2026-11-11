/**
 * De onde vem a imagem de cada item da demonstração. Primeiro procura um arquivo do Arthur em
 * `scripts/seed-assets/<tipo>/<chave>.(png|jpg|jpeg|webp)`; se não houver, gera uma composição original por código
 * (`png.ts`). Nunca baixa nada. O arquivo segue o mesmo caminho de upload da interface (multipart, campo `file`).
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderTilePng, type TileKind } from './png'

export const ASSETS_DIR = join(import.meta.dir, '..', 'seed-assets')

const EXTENSIONS = [
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['webp', 'image/webp'],
] as const

export type SeedImage = { bytes: Uint8Array; contentType: string; fileName: string; source: 'arquivo' | 'gerada' }

/** "Estúdio Duartina" → "estudio-duartina": o nome do arquivo que o Arthur coloca na pasta. */
export function assetKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Só o arquivo do Arthur, ou `null`. Para as pastas sem imagem gerada de reserva (a `vitrine/`, fotos 2 e 3 da galeria): sem
 * o arquivo, o estabelecimento fica com menos fotos, e a página usa o que tiver.
 */
export function fileFor(folder: string, label: string, dir = ASSETS_DIR): SeedImage | null {
  const key = assetKey(label)
  for (const [extension, contentType] of EXTENSIONS) {
    const path = join(dir, folder, `${key}.${extension}`)
    if (existsSync(path)) {
      return { bytes: readFileSync(path), contentType, fileName: `${key}.${extension}`, source: 'arquivo' }
    }
  }
  return null
}

/** `hueKey` separa a cor de itens com o mesmo nome em estabelecimentos diferentes; o arquivo do Arthur vale pelo `label`. */
export function imageFor(kind: TileKind, label: string, hueKey = label, dir = ASSETS_DIR): SeedImage {
  return fileFor(kind, label, dir) ?? { bytes: renderTilePng(kind, label, 512, hueKey), contentType: 'image/png', fileName: `${assetKey(label)}.png`, source: 'gerada' }
}
