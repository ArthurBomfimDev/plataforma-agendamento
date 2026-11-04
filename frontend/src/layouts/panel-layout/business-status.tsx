import {
  useOwnerBusiness,
  useOwnerChecklist,
  usePublishBusiness,
  useSubmitBusiness,
} from '@api/services/onboarding/hooks'
import { ROUTES, registerBusinessPath } from '@router/paths'
import { useCallback, useState } from 'react'

import type { BusinessContext } from '@store/session/types'
import { BusinessStatusBanner } from '@components/business-status-banner'
import { errorMessage } from '@api/base'
import { notify } from '@components/toaster/notify'
import { useNavigate } from 'react-router'

const seenKey = (businessId: string) => `vagoo-approved-seen:${businessId}`

// localStorage com try/catch: modo privado e armazenamento bloqueado não podem quebrar o painel.
const wasSeen = (businessId: string) => {
  try {
    return localStorage.getItem(seenKey(businessId)) === '1'
  } catch {
    return false
  }
}
const markSeen = (businessId: string) => {
  try {
    localStorage.setItem(seenKey(businessId), '1')
  } catch {
    // sem armazenamento: o aviso só volta no próximo acesso
  }
}

/** Para onde cada item da checklist leva. O que é do cadastro volta ao assistente, no rascunho. */
const FIX_ROUTES: Record<string, string> = {
  professional: ROUTES.panelProfessionals,
  service_with_professional: ROUTES.panelServices,
  work_schedule: ROUTES.panelSchedules,
}

/**
 * A faixa de status do estabelecimento no topo do painel do dono. Só o dono a vê (o profissional não publica nem
 * envia, e a API recusaria com 403). Some quando o estabelecimento está ativo, exceto o "Aprovado" do primeiro acesso.
 */
export const BusinessStatusPanel = ({ context }: { context: BusinessContext }) => {
  const navigate = useNavigate()
  const owner = context.role === 'Owner'
  const business = useOwnerBusiness(context.businessId, owner)
  const isDraft = business.data?.status === 'Draft'
  const checklist = useOwnerChecklist(context.businessId, owner && isDraft)
  const publish = usePublishBusiness()
  const submit = useSubmitBusiness()
  const [error, setError] = useState<string>()
  const [dismissed, setDismissed] = useState(false)

  const fix = useCallback(
    (key: string) => navigate(FIX_ROUTES[key] ?? registerBusinessPath(true)),
    [navigate],
  )

  if (!owner || !business.data) return null
  const { status, verificationLevel, category, statusReason } = business.data

  const run = (action: typeof publish, success: string) => {
    setError(undefined)
    action.mutate(undefined, {
      onSuccess: () => notify.success(success),
      onError: (failure) => setError(errorMessage(failure)),
    })
  }

  return (
    <BusinessStatusBanner
      business={{ status, verificationLevel, category, reason: statusReason }}
      checklist={checklist.data}
      checklistError={checklist.isError ? errorMessage(checklist.error) : undefined}
      onRetryChecklist={() => void checklist.refetch()}
      busy={publish.isPending || submit.isPending}
      error={error}
      showApproved={
        status === 'Active' &&
        verificationLevel === 'Verified' &&
        !dismissed &&
        !wasSeen(context.businessId)
      }
      onDismissApproved={() => {
        markSeen(context.businessId)
        setDismissed(true)
      }}
      onPublish={() => run(publish, 'Estabelecimento publicado.')}
      onSubmit={() => run(submit, 'Enviado para análise. Avisaremos por e-mail.')}
      onFix={fix}
    />
  )
}
