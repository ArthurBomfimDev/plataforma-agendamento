import { usePanelBusinessDetail, usePanelMutation } from '@lib/api/queries'

import type { SettingsData } from '@features/panel-settings/types'
import { SettingsScreen } from '@features/panel-settings'
import type { UpdateSchedulingPolicyRequest } from '@lib/api/types'
import { errorMessage } from '@lib/api/errors'
import { manageApi } from '@lib/api/endpoints'
import { toast } from '@lib/toast'
import { usePanelContext } from './panel-context'

/**
 * Painel — Configurações (Onda 7D). Grava a política; o painel inteiro recarrega, então o prazo e a
 * confirmação automática dos Pedidos mudam junto.
 */
export const PanelSettingsRoute = () => {
  const { context, business } = usePanelContext()
  const detail = usePanelBusinessDetail(context.businessId)
  const save = usePanelMutation(context.businessId, (request: UpdateSchedulingPolicyRequest) =>
    manageApi.updatePolicy(request),
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
          toast.success('Configurações salvas.')
          return null
        } catch (error) {
          return errorMessage(error)
        }
      }}
    />
  )
}
