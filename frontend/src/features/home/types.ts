import type { LucideIcon } from 'lucide-react'

import type { CardEstablishmentProps } from '@components/card-establishment/types'

export type HomeCategory = {
  id: string
  label: string
  icon: LucideIcon
}

export type HomeEstablishment = CardEstablishmentProps & {
  id: string
}

/** Lista "Perto de você": vem da busca da API, então tem carregando, erro e vazio. */
export type HomeNearby =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry?: () => void }
  | { status: 'ready'; items: HomeEstablishment[] }

export type HomeScreenProps = {
  /** Cidade de onde o consumidor está buscando, por exemplo `Garça, SP`. */
  locationLabel: string
  nearby: HomeNearby
}
