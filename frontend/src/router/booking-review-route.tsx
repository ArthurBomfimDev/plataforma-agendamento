import { SEARCH_PARAMS, availabilityPath } from './consts'
import { isValid, parse } from 'date-fns'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { BookingReviewScreen } from '../features/booking-review'
import { MOCK_TODAY } from '../features/availability/mock'
import { NotFoundScreen } from '../features/not-found'

export const BookingReviewRoute = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const professionalId = searchParams.get(SEARCH_PARAMS.professional)
  const date = parse(searchParams.get(SEARCH_PARAMS.date) ?? '', 'yyyy-MM-dd', new Date())
  const time = searchParams.get(SEARCH_PARAMS.time)

  if (!isValid(date) || !time) {
    return <NotFoundScreen />
  }

  return (
    <BookingReviewScreen
      businessId={businessId}
      serviceId={serviceId}
      professionalId={professionalId}
      date={date}
      time={time}
      // TODO: "hoje" do wireframe enquanto a disponibilidade é mock; com a API, vem do fuso do Business.
      today={MOCK_TODAY}
      // Volta ao calendário; o dia e o horário escolhidos não são restaurados.
      onBack={() => navigate(availabilityPath(businessId, serviceId, professionalId))}
      // TODO: enviar o pedido depende da API de Scheduling; "Enviar pedido" não faz nada por enquanto.
    />
  )
}
