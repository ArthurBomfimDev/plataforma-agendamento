export type ServiceCardProps = {
  name: string
  durationMinutes: number
  /** Preço em centavos, inteiro. */
  priceCents: number
  onBook?: () => void
  className?: string
}
