export const ROUTES = {
  home: '/',
  business: '/businesses/:businessId',
  chooseProfessional: '/businesses/:businessId/services/:serviceId/professionals',
  availability: '/businesses/:businessId/services/:serviceId/availability',
  bookingReview: '/businesses/:businessId/services/:serviceId/review',
  bookingSent: '/businesses/:businessId/services/:serviceId/sent',
} as const

/** Parâmetros de busca do fluxo de agendamento. `professional` ausente = "Sem preferência". */
export const SEARCH_PARAMS = {
  professional: 'professional',
  /** Dia escolhido, `yyyy-MM-dd`. */
  date: 'date',
  /** Horário de início, `HH:mm`. */
  time: 'time',
  /** Instante do envio do pedido, ISO 8601. */
  sentAt: 'sentAt',
} as const

export const businessPath = (businessId: string) => `/businesses/${encodeURIComponent(businessId)}`

const servicePath = (businessId: string, serviceId: string) =>
  `${businessPath(businessId)}/services/${encodeURIComponent(serviceId)}`

const withSearch = (path: string, params: Record<string, string | null>) => {
  const search = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== null),
  ).toString()
  return search ? `${path}?${search}` : path
}

export const chooseProfessionalPath = (businessId: string, serviceId: string) =>
  `${servicePath(businessId, serviceId)}/professionals`

export const availabilityPath = (
  businessId: string,
  serviceId: string,
  professionalId: string | null,
) =>
  withSearch(`${servicePath(businessId, serviceId)}/availability`, {
    [SEARCH_PARAMS.professional]: professionalId,
  })

type BookingSearch = { professionalId: string | null; date: string; time: string }

const bookingSearch = (booking: BookingSearch) => ({
  [SEARCH_PARAMS.professional]: booking.professionalId,
  [SEARCH_PARAMS.date]: booking.date,
  [SEARCH_PARAMS.time]: booking.time,
})

export const bookingReviewPath = (businessId: string, serviceId: string, booking: BookingSearch) =>
  withSearch(`${servicePath(businessId, serviceId)}/review`, bookingSearch(booking))

/**
 * TODO: provisório enquanto não há API. Com o pedido criado no backend, a tela passa a ser
 * `/appointments/:id` e os dados vêm do agendamento, não da URL.
 */
export const bookingSentPath = (
  businessId: string,
  serviceId: string,
  booking: BookingSearch & { sentAt: string },
) =>
  withSearch(`${servicePath(businessId, serviceId)}/sent`, {
    ...bookingSearch(booking),
    [SEARCH_PARAMS.sentAt]: booking.sentAt,
  })
