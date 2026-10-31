import { contextItems, useContextSwitch } from './use-account-menu'
import { useChangePassword, useUpdateMe } from '@lib/api/queries'

import type { MyAccountData } from '@features/my-account/types'
import { MyAccountScreen } from '@features/my-account'
import { ROUTES } from './consts'
import { RequireSession } from './require-session'
import { errorMessage } from '@lib/api/errors'
import { useNavigate } from 'react-router'

const MyAccount = () => {
  const navigate = useNavigate()
  const { me, context, leave } = useContextSwitch()
  const updateMe = useUpdateMe()
  const changePassword = useChangePassword()
  const several = me.data ? contextItems(me.data, context?.businessId ?? null).length > 1 : false

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

  return (
    <MyAccountScreen
      data={data}
      onSaveName={(fullName) => attempt(() => updateMe.mutateAsync(fullName))}
      onChangePassword={(current, next) =>
        attempt(() => changePassword.mutateAsync({ current, next }))
      }
      onSignOut={leave}
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
