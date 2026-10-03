import { SEARCH_PARAMS, businessPath } from './consts'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { BookingSentScreen } from '../features/booking-sent'
import { NotFoundScreen } from '../features/not-found'
import { isValid } from 'date-fns'
import { readBookingSearch } from './booking-search'
import { toast } from '../lib/toast'

export const BookingSentRoute = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const booking = readBookingSearch(searchParams)
  const sentAt = new Date(searchParams.get(SEARCH_PARAMS.sentAt) ?? '')

  if (!booking || !isValid(sentAt)) {
    return <NotFoundScreen />
  }

  return (
    <BookingSentScreen
      businessId={businessId}
      serviceId={serviceId}
      professionalId={booking.professionalId}
      date={booking.date}
      time={booking.time}
      sentAt={sentAt}
      // TODO: "Meus agendamentos" ainda não existe; o botão não faz nada.
      // TODO: cancelar de verdade depende da API de Scheduling. Por enquanto só avisa e volta ao
      // estabelecimento, de onde é um toque para pedir outro horário (remarcar = cancelar + novo
      // pedido). `replace`: o "voltar" do navegador não reabre um pedido cancelado.
      onCancel={() => {
        toast.success('Pedido cancelado')
        navigate(businessPath(businessId), { replace: true })
      }}
    />
  )
}
