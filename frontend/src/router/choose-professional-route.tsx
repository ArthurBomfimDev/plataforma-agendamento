import { useNavigate, useParams } from 'react-router'

import { ChooseProfessionalScreen } from '../features/choose-professional'
import { businessPath } from './consts'

export const ChooseProfessionalRoute = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const navigate = useNavigate()

  return (
    <ChooseProfessionalScreen
      businessId={businessId}
      serviceId={serviceId}
      // Volta para o estabelecimento, e não `navigate(-1)`: quem chega por link direto não tem histórico.
      onBack={() => navigate(businessPath(businessId))}
      // TODO: a tela de escolher horário ainda não existe; a seleção não navega por enquanto.
    />
  )
}
