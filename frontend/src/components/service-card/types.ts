import type { ReactNode } from 'react'

export type ServiceCardProps = {
  name: string
  durationMinutes: number
  /** Preço em centavos, inteiro. */
  priceCents: number
  onBook?: () => void
  /** À esquerda do nome: o ícone padrão do serviço pela categoria (Onda 6D). */
  leading?: ReactNode
  className?: string
}
