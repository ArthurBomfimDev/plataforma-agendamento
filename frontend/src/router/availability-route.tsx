import { SEARCH_PARAMS, bookingReviewPath, businessPath, chooseProfessionalPath } from './consts'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { AvailabilityScreen } from '../features/availability'
import { MOCK_TODAY } from '../features/availability/mock'
import { format } from 'date-fns'

export const AvailabilityRoute = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const professionalId = searchParams.get(SEARCH_PARAMS.professional)

  return (
    <AvailabilityScreen
      businessId={businessId}
      serviceId={serviceId}
      professionalId={professionalId}
      // TODO: "hoje" do wireframe enquanto a disponibilidade é mock; com a API, vem do fuso do Business.
      today={MOCK_TODAY}
      onBack={() => navigate(chooseProfessionalPath(businessId, serviceId))}
      onOpenBusiness={() => navigate(businessPath(businessId))}
      onContinue={(date, time) =>
        navigate(
          bookingReviewPath(businessId, serviceId, {
            professionalId,
            date: format(date, 'yyyy-MM-dd'),
            time,
          }),
        )
      }
    />
  )
}
