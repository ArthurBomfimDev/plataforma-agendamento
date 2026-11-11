import { ApiError, errorMessage } from '@api/base'
import { SENSITIVE_SCHEDULING, grantAndResend, isConsentRequired } from '@api/services/consent'
import { useConsentVersions, useGrantConsent } from '@api/services/consent/hooks'
import { availabilityPath, bookingSentPath, completeProfilePath, signInPath } from '@router/paths'
import { dateKeyIn, dayFromKey, timeIn } from '@utils/time-zone'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router'

import { BookingReviewScreen } from './screen'
import { NotFoundScreen } from '@pages/not-found'
import { RequireCustomerContext } from '@router/guards/require-customer-context'
import { RequireSession } from '@router/guards/require-session'
import { contextFallback } from '../context-fallback'
import { readBookingSearch } from '../booking-search'
import { notify } from '@components/toaster/notify'
import { useBookingContext } from '../use-booking-context'
import { useRequestAppointment } from '@api/services/appointment/hooks'
import { useState } from 'react'

/** `crypto.randomUUID` só existe em contexto seguro (https ou localhost); fora dele, um substituto. */
const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

const BookingReview = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const booking = readBookingSearch(searchParams)
  const context = useBookingContext(businessId, serviceId)
  const request = useRequestAppointment()
  // Uma chave por revisão: tocar duas vezes em "Enviar" devolve o mesmo pedido, não dois.
  const [idempotencyKey] = useState(newIdempotencyKey)
  // A observação do pedido que o servidor recusou por falta de consentimento. Nulo: nenhum pedido esperando.
  const [waitingConsent, setWaitingConsent] = useState<string | null>(null)
  const [consentError, setConsentError] = useState<string>()
  const versions = useConsentVersions(waitingConsent !== null)
  const grant = useGrantConsent()

  if (!booking) return <NotFoundScreen />
  if (context.status !== 'ready') return contextFallback(context)

  const { business, service, professionals } = context
  const professional = professionals.find(({ id }) => id === booking.professionalId)
  if (!professional) return <NotFoundScreen />

  const date = dayFromKey(dateKeyIn(booking.startsAt, business.timeZone))
  const time = timeIn(booking.startsAt, business.timeZone)

  const send = (note: string) =>
    request.mutate(
      {
        businessId,
        serviceId,
        professionalId: booking.professionalId,
        startsAt: booking.startsAtParam,
        notes: note || null,
        attendeeName: null,
        idempotencyKey,
      },
      {
        // `replace`: o "voltar" do navegador não reabre a revisão de um pedido já enviado.
        onSuccess: (appointment) =>
          navigate(
            bookingSentPath(businessId, serviceId, {
              appointmentId: appointment.id,
              sentAt: new Date().toISOString(),
            }),
            { replace: true },
          ),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 401) {
            navigate(signInPath(`${location.pathname}${location.search}`))
            return
          }
          // Conta sem perfil de consumidor (nasceu pelo estabelecimento ou pelo convite): completa e volta aqui.
          if (error instanceof ApiError && error.code === 'customer.profile_required') {
            navigate(completeProfilePath(`${location.pathname}${location.search}`))
            return
          }
          // Saúde sem consentimento não é erro de toast: a tela pede o consentimento ali mesmo.
          if (isConsentRequired(error)) {
            setWaitingConsent(note)
            return
          }
          setWaitingConsent(null)
          notify.error(error)
        },
      },
    )

  const accept = async (version: string, note: string) => {
    setConsentError(undefined)
    try {
      await grantAndResend(
        () => grant.mutateAsync({ purpose: SENSITIVE_SCHEDULING, version }),
        () => send(note),
      )
    } catch (error) {
      setConsentError(errorMessage(error))
      // A versão pode ter mudado enquanto a pessoa lia: o texto na tela precisa ser o vigente.
      void versions.refetch()
    }
  }

  return (
    <BookingReviewScreen
      business={{
        name: business.name,
        verified: business.verified,
        category: business.category,
        image: business.logo ?? business.cover,
      }}
      service={service}
      professionalName={professional.name}
      date={date}
      time={time}
      cancellationWindowHours={business.cancellationWindowHours}
      submitting={request.isPending}
      // Volta ao calendário; o dia e o horário escolhidos não são restaurados.
      onBack={() => navigate(availabilityPath(businessId, serviceId, booking.professionalId))}
      onSubmit={send}
      consent={
        waitingConsent === null
          ? undefined
          : {
              text: versions.isError
                ? {
                    status: 'error',
                    message: errorMessage(versions.error),
                    onRetry: () => void versions.refetch(),
                  }
                : versions.data
                  ? { status: 'ready', value: versions.data.sensitiveSchedulingText }
                  : { status: 'loading' },
              busy: grant.isPending || request.isPending,
              error: consentError,
              onAccept: () => {
                if (versions.data) void accept(versions.data.sensitiveScheduling, waitingConsent)
              },
            }
      }
    />
  )
}

export const BookingReviewRoute = () => (
  <RequireSession>
    <RequireCustomerContext>
      <BookingReview />
    </RequireCustomerContext>
  </RequireSession>
)
