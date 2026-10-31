import { ErrorScreen, LoadingScreen } from '@components/screen-state'

import type { BookingContext } from './use-booking-context'
import { NotFoundScreen } from '@pages/not-found'
import { errorMessage } from '@api/base'

/** Tela de carregando, não encontrado ou erro; `null` quando o contexto está pronto. */
export const contextFallback = (context: BookingContext) => {
  switch (context.status) {
    case 'loading':
      return <LoadingScreen />
    case 'not-found':
      return <NotFoundScreen />
    case 'error':
      return <ErrorScreen message={errorMessage(context.error)} onRetry={context.retry} />
    default:
      return null
  }
}
