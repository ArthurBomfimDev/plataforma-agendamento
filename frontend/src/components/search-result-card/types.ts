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
  /** Sem foto, o card mostra o bloco neutro do wireframe. */
  imageUrl?: string
  /** `null` quando não há horário livre na janela de busca. */
  availability: SearchResultAvailability | null
  onSelectSlot?: (slot: string) => void
  className?: string
}
