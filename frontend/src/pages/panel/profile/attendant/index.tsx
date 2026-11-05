import { useChangePassword, useUpdateMe } from '@api/services/auth/hooks'

import { AttendantProfileScreen } from './screen'
import type { MyAccountData } from '@pages/account/screen/types'
import { errorMessage } from '@api/base'
import { useContextSwitch } from '@hooks/use-account-menu'
import { usePanelContext } from '@layouts/panel-layout/context'

/** Painel — Meu perfil do atendente: os dados da conta, pelas mesmas rotas de Minha conta. */
export const AttendantProfileRoute = () => {
  const { business } = usePanelContext()
  const { me, leave } = useContextSwitch()
  const updateMe = useUpdateMe()
  const changePassword = useChangePassword()

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
    <AttendantProfileScreen
      data={data}
      businessName={business.name}
      onSaveName={(fullName) => attempt(() => updateMe.mutateAsync(fullName))}
      onChangePassword={(current, next) =>
        attempt(() => changePassword.mutateAsync({ current, next }))
      }
      onSignOut={leave}
    />
  )
}
