import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@api/services/media'

import type { UploadProblem } from './types'

const MEGABYTES = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const formatMegabytes = (bytes: number) => `${MEGABYTES.format(bytes / (1024 * 1024))} MB`

/**
 * Conferência no aparelho, antes de gastar o envio. É só conforto: a defesa real é o backend, que confere a
 * assinatura do arquivo, o tamanho e as dimensões.
 */
export const validateImageFile = (file: {
  name: string
  type: string
  size: number
}): UploadProblem | undefined => {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return {
      title: 'Formato não aceito',
      message: 'Aceitamos JPEG, PNG e WebP. SVG não é aceito.',
      hint: 'Conferimos o conteúdo do arquivo, não a extensão.',
    }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      title: 'Arquivo grande demais',
      message: `${file.name} tem ${formatMegabytes(file.size)}. O limite é 5 MB.`,
      hint: 'Tente exportar em qualidade menor ou escolher outra imagem.',
    }
  }
  if (file.size === 0) {
    return {
      title: 'Arquivo vazio',
      message: `${file.name} não tem conteúdo.`,
      hint: 'Escolha outra imagem.',
    }
  }
  return undefined
}

export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(',')

export const HELP_TEXT = 'JPEG, PNG ou WebP · até 5 MB'

/** Tamanho da moldura (Figma 19): logotipo 132×132, capa 132 de altura, foto de profissional 104 de altura. */
export const SHAPE_CLASSES = {
  square: 'size-33',
  cover: 'h-33 w-full',
  card: 'h-26 w-full',
} as const

/** Proporção reservada e `sizes` de cada formato, para o `SmartImage`. */
export const SHAPE_IMAGE = {
  square: { width: 1, height: 1, sizes: '132px' },
  cover: { width: 3, height: 1, sizes: '(min-width: 768px) 640px, 100vw' },
  card: { width: 16, height: 9, sizes: '(min-width: 1024px) 25vw, 50vw' },
} as const
