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
 * Rótulo do botão da conta (7CF): com mais de um contexto, o contexto atual ("Consumidor", "Painel: X"), que é o
 * que a pessoa troca; com um só, o nome dela — um papel sem alternativa não diz nada. Sem a conta carregada
 * ainda, o contexto da sessão.
 */
export const accountTriggerLabel = (
  me: Pick<CurrentUserResponse, 'fullName' | 'hasCustomerProfile' | 'businesses'> | undefined,
  currentBusinessId: string | null,
  currentBusinessName: string | null,
) => {
  if (!me) return contextLabel(currentBusinessName)
  return contextItems(me, currentBusinessId).length > 1
    ? contextLabel(currentBusinessName)
    : me.fullName
}

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
    // Para consumidor, sai do painel antes: com o contexto já trocado, o guard do painel
    // mandaria para a escolha de contexto. A Home é pública e não depende do token novo.
    if (!business) navigate(ROUTES.home)
    switchContext.mutate(
      { userId: me.data.id, business },
      {
        onSuccess: () => business && navigate(ROUTES.panelRequests),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  // Navega antes de limpar a sessão: dentro do painel, o guard reagiria primeiro e mandaria para
  // "Entrar" com o painel no `redirect`.
  const leave = () => {
    navigate(ROUTES.home)
    signOut()
    toast.info('Você saiu da sua conta.')
  }

  return { me, context, choose, leave, switching: switchContext.isPending }
}

/** Props do `AccountMenu`, ou `null` sem sessão. */
export const useAccountMenu = (): AccountMenuProps | null => {
  const signedIn = useSessionStore((state) => state.session !== null)
  const navigate = useNavigate()
  const { me, context, choose, leave } = useContextSwitch()
  if (!signedIn) return null

  const currentBusinessId = context?.businessId ?? null
  return {
    currentLabel: accountTriggerLabel(me.data, currentBusinessId, context?.businessName ?? null),
    items: me.data ? contextItems(me.data, currentBusinessId) : [],
    onSelect: choose,
    onAccount: () => navigate(ROUTES.account),
    onSignOut: leave,
  }
}
