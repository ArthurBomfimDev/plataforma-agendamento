import { useBusinessContext, useMe, useSignOut, useSwitchContext } from '@lib/api/queries'

import type { AccountMenuProps } from '@components/account-menu/types'
import type { CurrentUserResponse } from '@lib/api/types'
import { ROUTES } from './consts'
import { errorMessage } from '@lib/api/errors'
import { toast } from '@lib/toast'
import { useNavigate } from 'react-router'
import { useSessionStore } from '@lib/zustand/session'

const CUSTOMER = 'customer'

export const contextLabel = (businessName: string | null) =>
  businessName ? `Painel: ${businessName}` : 'Consumidor'

/** Os contextos que a conta pode abrir, na ordem do menu: consumidor primeiro. */
export const contextItems = (
  me: Pick<CurrentUserResponse, 'hasCustomerProfile' | 'businesses'>,
  currentBusinessId: string | null,
) => [
  ...(me.hasCustomerProfile || currentBusinessId === null
    ? [{ id: CUSTOMER, label: 'Consumidor', current: currentBusinessId === null }]
    : []),
  ...me.businesses.map(({ businessId, name }) => ({
    id: businessId,
    label: contextLabel(name),
    current: businessId === currentBusinessId,
  })),
]

/**
 * Troca de contexto e sair, para a barra superior, a lateral do painel e a tela de conta. Escolher
 * um painel abre os pedidos; escolher consumidor volta para a Home.
 */
export const useContextSwitch = () => {
  const navigate = useNavigate()
  const me = useMe()
  const context = useBusinessContext()
  const switchContext = useSwitchContext()
  const signOut = useSignOut()

  const choose = (id: string) => {
    if (!me.data) return
    const business =
      id === CUSTOMER
        ? null
        : (me.data.businesses.find(({ businessId }) => businessId === id) ?? null)
    switchContext.mutate(
      { userId: me.data.id, business },
      {
        onSuccess: () => navigate(business ? ROUTES.panelRequests : ROUTES.home),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const leave = () => {
    signOut()
    toast.info('Você saiu da sua conta.')
    navigate(ROUTES.home)
  }

  return { me, context, choose, leave, switching: switchContext.isPending }
}

/** Props do `AccountMenu`, ou `null` sem sessão. */
export const useAccountMenu = (): AccountMenuProps | null => {
  const signedIn = useSessionStore((state) => state.session !== null)
  const { me, context, choose, leave } = useContextSwitch()
  if (!signedIn) return null

  const currentBusinessId = context?.businessId ?? null
  return {
    currentLabel: contextLabel(context?.businessName ?? null),
    items: me.data ? contextItems(me.data, currentBusinessId) : [],
    onSelect: choose,
    onSignOut: leave,
  }
}
