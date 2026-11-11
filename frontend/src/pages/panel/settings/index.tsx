import { usePanelBusinessDetail, usePanelMutation } from '@api/services/panel/hooks'

import type { SettingsData } from './screen/types'
import { SettingsScreen } from './screen'
import type { UpdateSchedulingPolicyRequest } from '@api/models'
import { errorMessage } from '@api/base'
import { managementService } from '@api/services/management'
import { notify } from '@components/toaster/notify'
import { usePanelContext } from '@layouts/panel-layout/context'

/**
 * Painel — Configurações (Onda 7D). Grava a política; o painel inteiro recarrega, então o prazo e a
 * confirmação automática dos Pedidos mudam junto.
 */
export const PanelSettingsRoute = () => {
  const { context, business } = usePanelContext()
  const detail = usePanelBusinessDetail(context.businessId)
  const save = usePanelMutation(context.businessId, (request: UpdateSchedulingPolicyRequest) =>
    managementService.updatePolicy(request),
  )

  const data: SettingsData = detail.isError
    ? {
        status: 'error',
        message: errorMessage(detail.error),
        onRetry: () => void detail.refetch(),
      }
    : detail.data
      ? { status: 'ready', policy: detail.data.policy }
      : { status: 'loading' }

  return (
    <SettingsScreen
      data={data}
      businessName={business.name}
      onSave={async (policy) => {
        try {
          // O fuso não muda nesta tela: `null` mantém o atual.
          await save.mutateAsync({ ...policy, timeZone: null })
          notify.success('Configurações salvas.')
          return null
        } catch (error) {
          return errorMessage(error)
        }
      }}
    />
  )
}
