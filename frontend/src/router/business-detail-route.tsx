import { BusinessDetailScreen } from '../features/business-detail'
import { useParams } from 'react-router'

export const BusinessDetailRoute = () => {
  const { businessId = '' } = useParams()

  return <BusinessDetailScreen businessId={businessId} />
}
