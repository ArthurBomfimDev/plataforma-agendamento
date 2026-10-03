import { PROFESSIONAL_SEARCH_PARAM, chooseProfessionalPath } from './consts'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { AvailabilityScreen } from '../features/availability'
import { MOCK_TODAY } from '../features/availability/mock'

export const AvailabilityRoute = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  return (
    <AvailabilityScreen
      businessId={businessId}
      serviceId={serviceId}
      professionalId={searchParams.get(PROFESSIONAL_SEARCH_PARAM)}
      // TODO: "hoje" do wireframe enquanto a disponibilidade é mock; com a API, vem do fuso do Business.
      today={MOCK_TODAY}
      onBack={() => navigate(chooseProfessionalPath(businessId, serviceId))}
      // TODO: a tela de confirmação ainda não existe; "Continuar" não navega por enquanto.
    />
  )
}
