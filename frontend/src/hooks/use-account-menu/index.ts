import { useBusinessContext, useMe, useSignOut, useSwitchContext } from '@api/services/auth/hooks'

import type { AccountMenuProps } from '@components/account-menu/types'
import type { CurrentUserResponse } from '@api/models'
import { ROUTES, registerBusinessPath } from '@router/paths'
import { hasPlatformAdminRole } from '@utils/jwt'
import { notify } from '@components/toaster/notify'
import { useNavigate } from 'react-router'
import { useSessionStore } from '@store/session'

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
        onError: (error) => notify.error(error),
      },
    )
  }

  // Navega antes de limpar a sessão: dentro do painel, o guard reagiria primeiro e mandaria para
  // "Entrar" com o painel no `redirect`.
  const leave = () => {
    navigate(ROUTES.home)
    signOut()
    notify.info('Você saiu da sua conta.')
  }

  return { me, context, choose, leave, switching: switchContext.isPending }
}

/** Props do `AccountMenu`, ou `null` sem sessão. */
export const useAccountMenu = (): AccountMenuProps | null => {
  const signedIn = useSessionStore((state) => state.session !== null)
  const accessToken = useSessionStore((state) => state.session?.accessToken ?? null)
  const navigate = useNavigate()
  const { me, context, choose, leave } = useContextSwitch()
  if (!signedIn) return null

  const currentBusinessId = context?.businessId ?? null
  const businesses = me.data?.businesses ?? []
  // "Meu painel" só aparece para quem tem estabelecimento e está como consumidor (no painel, já está lá).
  const onOpenPanel =
    businesses.length > 0 && currentBusinessId === null
      ? () =>
          businesses.length === 1
            ? choose(businesses[0].businessId)
            : navigate(ROUTES.chooseContext)
      : undefined
  return {
    onOpenPanel,
    onRegisterBusiness: () => navigate(registerBusinessPath()),
    // Só aparece para o Admin; o servidor recusa com 403 quem não for (a leitura do token aqui é só conveniência).
    onOpenAdmin: hasPlatformAdminRole(accessToken)
      ? () => navigate(ROUTES.adminBusinesses)
      : undefined,
    currentLabel: accountTriggerLabel(me.data, currentBusinessId, context?.businessName ?? null),
    items: me.data ? contextItems(me.data, currentBusinessId) : [],
    onSelect: choose,
    onAccount: () => navigate(ROUTES.account),
    onSignOut: leave,
  }
}
