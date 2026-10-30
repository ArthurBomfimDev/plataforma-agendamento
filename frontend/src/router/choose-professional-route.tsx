import { availabilityPath, businessPath } from './consts'
import { useNavigate, useParams } from 'react-router'

import { ChooseProfessionalScreen } from '@features/choose-professional'
import { contextFallback } from './context-fallback'
import { useBookingContext } from './use-booking-context'

export const ChooseProfessionalRoute = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const navigate = useNavigate()
  const context = useBookingContext(businessId, serviceId)

  if (context.status !== 'ready') return contextFallback(context)

  const { business, service, professionals } = context

  return (
    <ChooseProfessionalScreen
      businessName={business.name}
      service={service}
      professionals={professionals}
      // Volta para o estabelecimento, e não `navigate(-1)`: quem chega por link direto não tem histórico.
      onBack={() => navigate(businessPath(businessId))}
      onSelectProfessional={(professionalId) =>
        navigate(availabilityPath(businessId, serviceId, professionalId))
      }
    />
  )
}
