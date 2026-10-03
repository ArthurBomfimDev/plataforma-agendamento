import { availabilityPath, businessPath } from './consts'
import { useNavigate, useParams } from 'react-router'

import { ChooseProfessionalScreen } from '../features/choose-professional'

export const ChooseProfessionalRoute = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const navigate = useNavigate()

  return (
    <ChooseProfessionalScreen
      businessId={businessId}
      serviceId={serviceId}
      // Volta para o estabelecimento, e não `navigate(-1)`: quem chega por link direto não tem histórico.
      onBack={() => navigate(businessPath(businessId))}
      onSelectProfessional={(professionalId) =>
        navigate(availabilityPath(businessId, serviceId, professionalId))
      }
    />
  )
}
