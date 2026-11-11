import type { ImageSet } from '@api/models'
import { apiBaseUrl } from '@api/base'

/**
 * URL de mídia pronta para `<img>`. A API devolve caminho relativo a ela (`/media/…`, disco local) ou URL absoluta
 * (armazenamento externo). A relativa ganha a `baseURL` da API — nunca `window.location.origin` (regra 2).
 */
export const mediaUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `${apiBaseUrl}${url}`)

/** Larguras reais dos três tamanhos (lado maior), para o `srcSet`. */
export const IMAGE_WIDTHS = { small: 160, medium: 640, large: 1280 } as const

export const srcSetOf = (image: ImageSet) =>
  (Object.keys(IMAGE_WIDTHS) as (keyof ImageSet)[])
    .map((size) => `${mediaUrl(image[size])} ${IMAGE_WIDTHS[size]}w`)
    .join(', ')

/** Tipos e teto que o backend aceita. No cliente é só conforto: quem recusa de verdade é a API. */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
