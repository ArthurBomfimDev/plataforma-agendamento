import { ErrorScreen, LoadingScreen } from '@components/screen-state'
import { ROUTES, businessPath } from './consts'
import { dateKeyIn, dayFromKey, timeIn } from '@lib/api/time'
import { useCancelAppointment, useMyAppointments } from '@lib/api/queries'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { BookingSentScreen } from '@features/booking-sent'
import { NotFoundScreen } from '@features/not-found'
import { RequireSession } from './require-session'
import { addHours } from 'date-fns'
import { contextFallback } from './context-fallback'
import { errorMessage } from '@lib/api/errors'
import { readSentSearch } from './booking-search'
import { toast } from '@lib/toast'
import { useBookingContext } from './use-booking-context'

const BookingSent = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const sent = readSentSearch(searchParams)
  const context = useBookingContext(businessId, serviceId)
  const appointments = useMyAppointments()
  const cancel = useCancelAppointment()

  if (!sent) return <NotFoundScreen />
  if (context.status !== 'ready') return contextFallback(context)
  if (appointments.isError) {
    return (
      <ErrorScreen
        message={errorMessage(appointments.error)}
        onRetry={() => void appointments.refetch()}
      />
    )
  }
  if (!appointments.data) return <LoadingScreen />

  const appointment = appointments.data.find(({ id }) => id === sent.appointmentId)
  if (!appointment) return <NotFoundScreen />

  const { business, professionals } = context
  const professional = professionals.find(({ id }) => id === appointment.professionalId)
  const expiresAt = appointment.expiresAt
    ? new Date(appointment.expiresAt)
    : addHours(sent.sentAt, business.pendingExpirationHours)

  return (
    <BookingSentScreen
      businessName={business.name}
      service={{
        name: appointment.serviceName,
        durationMinutes: appointment.durationMinutes,
        priceCents: appointment.priceCents,
      }}
      professionalName={professional?.name ?? null}
      date={dayFromKey(dateKeyIn(appointment.startsAt, business.timeZone))}
      time={timeIn(appointment.startsAt, business.timeZone)}
      sentAt={sent.sentAt}
      expiresAt={expiresAt}
      confirmationHours={business.pendingExpirationHours}
      cancelling={cancel.isPending}
      onViewAppointments={() => navigate(ROUTES.appointments)}
      // Remarcar = cancelar + novo pedido; volta ao estabelecimento, a um toque de pedir outro.
      // `replace`: o "voltar" do navegador não reabre um pedido cancelado.
      onCancel={() =>
        cancel.mutate(appointment.id, {
          onSuccess: () => {
            toast.success('Pedido cancelado')
            navigate(businessPath(businessId), { replace: true })
          },
          onError: (error) => toast.error(errorMessage(error)),
        })
      }
    />
  )
}

export const BookingSentRoute = () => (
  <RequireSession>
    <BookingSent />
  </RequireSession>
)
