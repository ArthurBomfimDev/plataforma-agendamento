import { contextItems, useContextSwitch } from '@hooks/use-account-menu'
import { useChangePassword, useUpdateMe } from '@api/services/auth/hooks'

import { useMyConsents, useRevokeConsent } from '@api/services/consent/hooks'

import type { ConsentsData, MyAccountData } from './screen/types'
import { MyAccountScreen } from './screen'
import { ROUTES, completeProfilePath, registerBusinessPath } from '@router/paths'
import { RequireSession } from '@router/guards/require-session'
import { errorMessage } from '@api/base'
import { useNavigate } from 'react-router'

const MyAccount = () => {
  const navigate = useNavigate()
  const { me, context, choose, leave } = useContextSwitch()
  const updateMe = useUpdateMe()
  const changePassword = useChangePassword()
  const consents = useMyConsents()
  const revokeConsent = useRevokeConsent()
  const several = me.data ? contextItems(me.data, context?.businessId ?? null).length > 1 : false

  // "Meu painel": só para quem tem estabelecimento e está como consumidor. Com um só, abre direto; com vários, escolhe.
  const businesses = me.data?.businesses ?? []
  const onOpenPanel =
    businesses.length > 0 && !context
      ? () =>
          businesses.length === 1
            ? choose(businesses[0].businessId)
            : navigate(ROUTES.chooseContext)
      : undefined

  const attempt = async (task: () => Promise<unknown>) => {
    try {
      await task()
      return null
    } catch (error) {
      return errorMessage(error)
    }
  }

  const data: MyAccountData = me.isError
    ? { status: 'error', message: errorMessage(me.error), onRetry: () => void me.refetch() }
    : me.data
      ? { status: 'ready', fullName: me.data.fullName, email: me.data.email }
      : { status: 'loading' }

  const consentsData: ConsentsData = consents.isError
    ? {
        status: 'error',
        message: errorMessage(consents.error),
        onRetry: () => void consents.refetch(),
      }
    : consents.data
      ? { status: 'ready', items: consents.data }
      : { status: 'loading' }

  return (
    <MyAccountScreen
      data={data}
      consents={consentsData}
      onRevokeConsent={(purpose) => attempt(() => revokeConsent.mutateAsync(purpose))}
      onSaveName={(fullName) => attempt(() => updateMe.mutateAsync(fullName))}
      onChangePassword={(current, next) =>
        attempt(() => changePassword.mutateAsync({ current, next }))
      }
      onSignOut={leave}
      onOpenPanel={onOpenPanel}
      onCompleteProfile={
        me.data && !me.data.hasCustomerProfile
          ? () => navigate(completeProfilePath(ROUTES.account))
          : undefined
      }
      onRegisterBusiness={() => navigate(registerBusinessPath())}
      onSwitchContext={several ? () => navigate(ROUTES.chooseContext) : undefined}
    />
  )
}

/** `#/account` (Onda 7CF): Minha conta. Exige sessão; vale para qualquer contexto. */
export const MyAccountRoute = () => (
  <RequireSession>
    <MyAccount />
  </RequireSession>
)
