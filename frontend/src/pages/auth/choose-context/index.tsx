import { type ChooseContextState, ROUTES } from '@router/paths'
import { contextItems, useContextSwitch } from '@hooks/use-account-menu'
import { useLocation, useNavigate } from 'react-router'

import { ChooseContextScreen } from './screen'
import { RequireSession } from '@router/guards/require-session'
import { errorMessage } from '@api/base'

const ChooseContext = () => {
  const navigate = useNavigate()
  const state = (useLocation().state ?? {}) as ChooseContextState
  const { me, context, choose, leave, switching } = useContextSwitch()
  const currentBusinessId = context?.businessId ?? null
  const items = me.data ? contextItems(me.data, currentBusinessId) : []

  return (
    <ChooseContextScreen
      status={me.isError ? 'error' : me.data ? 'ready' : 'loading'}
      errorMessage={me.isError ? errorMessage(me.error) : undefined}
      onRetry={() => void me.refetch()}
      fullName={me.data?.fullName}
      items={items}
      fromPanel={state.reason === 'panel'}
      fromCustomerScreen={state.reason === 'customer'}
      switching={switching}
      onChoose={(id) => {
        // O contexto atual não troca nada: só volta para onde ele mora.
        if (items.find((item) => item.id === id)?.current) {
          navigate(currentBusinessId ? ROUTES.panelRequests : ROUTES.home)
        } else {
          choose(id)
        }
      }}
      onSignOut={leave}
      onAccount={() => navigate(ROUTES.account)}
    />
  )
}

/** Conta e troca de contexto. Exige sessão. */
export const ChooseContextRoute = () => (
  <RequireSession>
    <ChooseContext />
  </RequireSession>
)
