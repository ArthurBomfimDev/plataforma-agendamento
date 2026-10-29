import type { ImageSet } from '@lib/api/types'

export type SearchResultAvailability = {
  /** Rótulo do dia, por exemplo `Hoje` ou `Amanhã`. */
  dayLabel: string
  /** Horários já formatados no fuso do estabelecimento, por exemplo `14:30`. */
  slots: string[]
}

export type SearchResultCardProps = {
  name: string
  serviceName: string
  durationMinutes: number
  /** Preço em centavos, inteiro. */
  priceCents: number
  distanceKm: number
  /** Logotipo ou capa. Sem imagem, a ilustração da categoria (Onda 6D). */
  image?: ImageSet | null
  /** `Beleza` ou `Saude`. */
  category?: string
  /**
   * `null` quando não há horário livre na janela de busca. Ausente (`undefined`) quando a tela não calculou
   * horários — a busca não calcula —, e o card não diz nada sobre eles.
   */
  availability?: SearchResultAvailability | null
  /** O preço é o menor dos profissionais: o card escreve "a partir de". */
  priceFrom?: boolean
  onSelectSlot?: (slot: string) => void
  /** Abre o estabelecimento. A área de toque é o card inteiro, sem aninhar bloco em botão. */
  onOpen?: () => void
  className?: string
}
