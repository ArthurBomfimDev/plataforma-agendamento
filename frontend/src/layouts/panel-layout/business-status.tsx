import {
  GUIDE_PARAM,
  bannerState,
  missingItems,
  requiredItems,
  stepOf,
} from '@components/business-status-banner/consts'
import {
  useOwnerBusiness,
  useOwnerChecklist,
  usePublishBusiness,
  useSubmitBusiness,
} from '@api/services/onboarding/hooks'
import { ROUTES, registerBusinessPath } from '@router/paths'
import { markSeen, wasSeen } from '@utils/seen-flag'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import type { BusinessContext } from '@store/session/types'
import { BusinessStatusBanner } from '@components/business-status-banner'
import { VerificationIntroDialog } from '@components/business-status-banner/components/verification-intro-dialog'
import { errorMessage } from '@api/base'
import { notify } from '@components/toaster/notify'

const approvedKey = (businessId: string) => `vagoo-approved-seen:${businessId}`
const introKey = (businessId: string) => `vagoo-verification-intro-seen:${businessId}`

/**
 * Para onde cada item da checklist leva. O que é do cadastro volta ao assistente, no rascunho. Os que têm
 * página no painel abrem o passo guiado: a URL leva `?passo=<item>` e a faixa passa a acompanhar o dono.
 */
const FIX_ROUTES: Record<string, string> = {
  professional: ROUTES.panelProfessionals,
  service_with_professional: ROUTES.panelServices,
  work_schedule: ROUTES.panelSchedules,
}

/**
 * A faixa de status do estabelecimento no topo do painel do dono, e o modal do primeiro acesso. Só o dono os
 * vê (o profissional não publica nem envia, e a API recusaria com 403). A faixa some quando o estabelecimento
 * está ativo, exceto o "Aprovado" do primeiro acesso.
 */
export const BusinessStatusPanel = ({ context }: { context: BusinessContext }) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const owner = context.role === 'Owner'
  const business = useOwnerBusiness(context.businessId, owner)
  const isDraft = business.data?.status === 'Draft'
  const checklist = useOwnerChecklist(context.businessId, owner && isDraft)
  const publish = usePublishBusiness()
  const submit = useSubmitBusiness()
  const [error, setError] = useState<string>()
  const [dismissed, setDismissed] = useState(false)
  const [introSeen, setIntroSeen] = useState(() => wasSeen(introKey(context.businessId)))

  const guideKey = searchParams.get(GUIDE_PARAM) ?? undefined
  const exitGuide = useCallback(
    () =>
      setSearchParams(
        (current) => {
          current.delete(GUIDE_PARAM)
          return current
        },
        { replace: true },
      ),
    [setSearchParams],
  )

  // O passo guiado acaba sozinho quando o item é concluído (ou se a chave da URL não é de um passo).
  const checklistData = checklist.data
  const guideOver =
    guideKey !== undefined &&
    (!(guideKey in FIX_ROUTES) || (checklistData !== undefined && !stepOf(checklistData, guideKey)))
  useEffect(() => {
    if (guideOver) exitGuide()
  }, [guideOver, exitGuide])

  const fix = useCallback(
    (key: string) => {
      const route = FIX_ROUTES[key]
      navigate(
        route ? { pathname: route, search: `?${GUIDE_PARAM}=${key}` } : registerBusinessPath(true),
      )
    },
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

  const items = checklistData ? requiredItems(checklistData) : []
  const firstPending = checklistData ? missingItems(checklistData)[0]?.key : undefined
  // O modal é só do primeiro acesso ao rascunho (não do recusado, que já viu a lista): uma vez por estabelecimento.
  const showIntro =
    !introSeen &&
    bannerState({ status, verificationLevel }) === 'draft' &&
    firstPending !== undefined

  const closeIntro = () => {
    markSeen(introKey(context.businessId))
    setIntroSeen(true)
  }

  return (
    <>
      <BusinessStatusBanner
        business={{ status, verificationLevel, category, reason: statusReason }}
        checklist={checklistData}
        checklistError={checklist.isError ? errorMessage(checklist.error) : undefined}
        onRetryChecklist={() => void checklist.refetch()}
        busy={publish.isPending || submit.isPending}
        error={error}
        showApproved={
          status === 'Active' &&
          verificationLevel === 'Verified' &&
          !dismissed &&
          !wasSeen(approvedKey(context.businessId))
        }
        onDismissApproved={() => {
          markSeen(approvedKey(context.businessId))
          setDismissed(true)
        }}
        onPublish={() => run(publish, 'Estabelecimento publicado.')}
        onSubmit={() => run(submit, 'Enviado para análise. Avisaremos por e-mail.')}
        onFix={fix}
        guide={guideKey && !guideOver ? { key: guideKey, onExit: exitGuide } : undefined}
      />
      <VerificationIntroDialog
        open={showIntro}
        items={items}
        onStart={() => {
          closeIntro()
          if (firstPending) fix(firstPending)
        }}
        onLater={closeIntro}
      />
    </>
  )
}
