import { useNavigate, useParams } from 'react-router'

import { BusinessDetailScreen } from '@features/business-detail'
import { chooseProfessionalPath } from './consts'

export const BusinessDetailRoute = () => {
  const { businessId = '' } = useParams()
  const navigate = useNavigate()

  return (
    <BusinessDetailScreen
      businessId={businessId}
      onBookService={(serviceId) => navigate(chooseProfessionalPath(businessId, serviceId))}
    />
  )
}
