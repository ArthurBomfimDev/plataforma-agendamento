import { ROUTES, SEARCH_PARAMS, safeRedirect } from '@router/paths'
import { useNavigate, useSearchParams } from 'react-router'

import { CompleteProfileScreen } from './screen'
import type { CompleteProfileData } from './screen/types'
import { RequireSession } from '@router/guards/require-session'
import { errorMessage } from '@api/base'
import { useCompleteCustomerProfile } from '@api/services/customer/hooks'
import { useMe } from '@api/services/auth/hooks'

const CompleteProfile = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const destination = safeRedirect(searchParams.get(SEARCH_PARAMS.redirect)) ?? ROUTES.home
  const me = useMe()
  const complete = useCompleteCustomerProfile()

  const data: CompleteProfileData = me.isError
    ? { status: 'error', message: errorMessage(me.error), onRetry: () => void me.refetch() }
    : me.data
      ? { status: 'ready', fullName: me.data.fullName, alreadyComplete: me.data.hasCustomerProfile }
      : { status: 'loading' }

  const goOn = () => navigate(destination, { replace: true })

  return (
    <CompleteProfileScreen
      data={data}
      submitting={complete.isPending}
      error={complete.isError ? errorMessage(complete.error) : undefined}
      onSubmit={({ birthDate, socialName }) =>
        complete.mutate({ birthDate, socialName: socialName || null }, { onSuccess: goOn })
      }
      onContinue={goOn}
    />
  )
}

/** `#/completar-cadastro`: exige sessão. Volta para `redirect` (o pedido que exigiu o perfil) ou para a Home. */
export const CompleteProfileRoute = () => (
  <RequireSession>
    <CompleteProfile />
  </RequireSession>
)
