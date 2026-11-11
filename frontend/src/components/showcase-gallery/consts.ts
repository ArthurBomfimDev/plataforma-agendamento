import type { ImageSet } from '@api/models'

/**
 * As fotos que a vitrine mostra: a galeria (até 3) e, para um estabelecimento antigo que só tem capa, a capa. Vazio:
 * a tela mostra a ilustração padrão da categoria, nunca uma área vazia.
 */
export const showcasePhotos = (
  photos: ImageSet[] | undefined,
  cover: ImageSet | null | undefined,
) => (photos && photos.length > 0 ? photos.slice(0, 3) : cover ? [cover] : [])

/** Texto alternativo: a foto mostra o lugar, então é informativa. A primeira é a capa. */
export const photoAlt = (name: string, index: number, total: number) =>
  total === 1 ? `Foto de ${name}` : `Foto ${index + 1} de ${total} de ${name}`

/**
 * Computador: a principal à esquerda e as outras empilhadas à direita (com três fotos, duas; com duas, uma). Celular:
 * rolagem horizontal, uma foto e um pedaço da próxima. Classes escritas por extenso para o Tailwind enxergar.
 */
export const GRID_BY_COUNT: Record<number, string> = {
  0: '',
  1: '',
  2: 'lg:grid lg:grid-cols-[1fr_18.75rem] lg:grid-rows-1',
  3: 'lg:grid lg:grid-cols-[1fr_18.75rem] lg:grid-rows-2',
}

export const TILE_BY_POSITION = (index: number, count: number) =>
  index === 0 && count === 3 ? 'lg:row-span-2' : ''
