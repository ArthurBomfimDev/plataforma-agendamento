import type { HomeNearby } from '@features/home/types'
import { HomeScreen } from '@features/home'
import { errorMessage } from '@lib/api/errors'
import { toHomeEstablishment } from './adapters'
import { useLocationStore } from '@lib/zustand/location'
import { useSearchBusinesses } from '@lib/api/queries'

/**
 * Home com a busca perto da referência escolhida (Onda 6B). Sem referência, nada de cidade fixa: a tela pede a
 * localização. A demonstração escolhe "Garça, SP (demonstração)" no seletor.
 */
export const HomeRoute = () => {
  const location = useLocationStore((state) => state.location)
  const openPicker = useLocationStore((state) => state.openPicker)
  const search = useSearchBusinesses(location)

  const nearby: HomeNearby = !location
    ? { status: 'no-location' }
    : search.isError
      ? {
          status: 'error',
          message: errorMessage(search.error),
          onRetry: () => void search.refetch(),
        }
      : search.data
        ? { status: 'ready', items: search.data.items.map(toHomeEstablishment) }
        : { status: 'loading' }

  return (
    <HomeScreen
      locationLabel={location?.label ?? null}
      nearby={nearby}
      onChooseLocation={openPicker}
    />
  )
}
