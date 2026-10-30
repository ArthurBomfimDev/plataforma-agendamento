import type { LucideIcon } from 'lucide-react'

import type { CardEstablishmentProps } from '@components/card-establishment/types'
import type { SearchFilters } from '@lib/api/search'

export type HomeCategory = {
  id: string
  label: string
  icon: LucideIcon
  /** A busca que o tile abre: categoria do backend ou termo. */
  search: Partial<SearchFilters>
}

export type HomeEstablishment = CardEstablishmentProps & {
  id: string
}

/**
 * Lista "Perto de você": vem da busca da API, então tem carregando, erro e vazio. Sem referência escolhida
 * (`no-location`), não há busca: a tela pede a localização.
 */
export type HomeNearby =
  | { status: 'no-location' }
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry?: () => void }
  | { status: 'ready'; items: HomeEstablishment[] }

export type HomeScreenProps = {
  /** Referência da busca, por exemplo `Centro, Garça`. Nula enquanto o consumidor não escolheu. */
  locationLabel: string | null
  nearby: HomeNearby
  /** Abre o seletor de localização. */
  onChooseLocation?: () => void
}
