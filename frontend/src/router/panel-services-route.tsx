import {
  MOCK_BUSINESS_CATEGORY,
  MOCK_PREVIEW_HOURS,
  MOCK_SERVICE_PROFESSIONALS,
  MOCK_SERVICE_VALUES,
} from '@features/service-form/mock'

import { MOCK_BUSINESS } from '@features/business-agenda/mock'
import { ServiceFormScreen } from '@features/service-form'
import { toast } from '@lib/toast'
import { usePanelContext } from './panel-context'

/**
 * Cadastro de serviço (tela 11), dentro do `PanelLayout`.
 *
 * TODO: salvar depende da API de Catalog; por enquanto o serviço validado não vai a lugar nenhum e
 * o aviso diz isso. Cancelar volta para a agenda enquanto não existe a lista de serviços.
 */
export const PanelServicesRoute = () => {
  const { navigateTo } = usePanelContext()

  return (
    <ServiceFormScreen
      businessName={MOCK_BUSINESS.name}
      categoryName={MOCK_BUSINESS_CATEGORY}
      professionals={MOCK_SERVICE_PROFESSIONALS}
      initialValues={MOCK_SERVICE_VALUES}
      previewHours={MOCK_PREVIEW_HOURS}
      onSave={(draft) =>
        toast.info(
          `"${draft.name}" está pronto, mas ainda não foi gravado: falta a API de serviços.`,
        )
      }
      onCancel={() => navigateTo('agenda')}
    />
  )
}
