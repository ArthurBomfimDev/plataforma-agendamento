import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@api/services/media'

/**
 * Conferência no aparelho, antes de gastar o envio. É só conforto: a defesa real é o backend, que confere a
 * assinatura do arquivo, o tamanho e as dimensões.
 */
export const validateImageFile = (file: { type: string; size: number }): string | undefined => {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Escolha uma imagem JPEG, PNG ou WebP.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'A imagem passa de 5 MB. Escolha uma menor.'
  }
  if (file.size === 0) {
    return 'O arquivo está vazio.'
  }
  return undefined
}

export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(',')

export const SHAPE_CLASSES = {
  cover: 'aspect-video w-full rounded-lg',
  square: 'aspect-square w-32 rounded-lg',
  round: 'aspect-square w-24 rounded-(--radius-full)',
} as const
