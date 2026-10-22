import { DEFAULT_LOCATION } from '@components/top-bar/consts'
import type { HomeNearby } from '@features/home/types'
import { HomeScreen } from '@features/home'
import { errorMessage } from '@lib/api/errors'
import { toHomeEstablishment } from './adapters'
import { useSearchBusinesses } from '@lib/api/queries'

export const HomeRoute = () => {
  const search = useSearchBusinesses(DEFAULT_LOCATION)

  const nearby: HomeNearby = search.isError
    ? { status: 'error', message: errorMessage(search.error), onRetry: () => void search.refetch() }
    : search.data
      ? { status: 'ready', items: search.data.items.map(toHomeEstablishment) }
      : { status: 'loading' }

  return <HomeScreen locationLabel={DEFAULT_LOCATION.label} nearby={nearby} />
}
