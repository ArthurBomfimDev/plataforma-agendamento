import { GUIDE_PARAM, stepOf } from '@components/business-status-banner/consts'

import { useOwnerChecklist } from '@api/services/onboarding/hooks'
import { useSearchParams } from 'react-router'

/**
 * A página está no passo guiado deste item da checklist? Devolve o número do passo ("4 de 6") enquanto o
 * dono segue o passo e o item continua pendente; `undefined` fora disso. A checklist é a mesma consulta da
 * faixa, então não há segunda requisição, e ela se refaz sozinha quando o dono salva algo no painel.
 */
export const useGuidedStep = (businessId: string, key: string) => {
  const [searchParams] = useSearchParams()
  const active = searchParams.get(GUIDE_PARAM) === key
  const checklist = useOwnerChecklist(businessId, active)

  return active && checklist.data ? stepOf(checklist.data, key) : undefined
}
