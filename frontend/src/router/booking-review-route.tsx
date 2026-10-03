import { availabilityPath, bookingSentPath } from './consts'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { BookingReviewScreen } from '../features/booking-review'
import { MOCK_TODAY } from '../features/availability/mock'
import { NotFoundScreen } from '../features/not-found'
import { readBookingSearch } from './booking-search'

export const BookingReviewRoute = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const booking = readBookingSearch(searchParams)

  if (!booking) {
    return <NotFoundScreen />
  }

  const { professionalId, date, dateParam, time } = booking

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
      // TODO: enviar o pedido (e a observação) depende da API de Scheduling. Por enquanto só
      // avança; `replace` evita que o "voltar" do navegador reabra a revisão de um pedido enviado.
      onSubmit={() =>
        navigate(
          bookingSentPath(businessId, serviceId, {
            professionalId,
            date: dateParam,
            time,
            sentAt: new Date().toISOString(),
          }),
          { replace: true },
        )
      }
    />
  )
}
