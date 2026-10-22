import type { NavigationItemId } from '@components/bottom-navigation/types'

export const ROUTES = {
  home: '/',
  business: '/businesses/:businessId',
  chooseProfessional: '/businesses/:businessId/services/:serviceId/professionals',
  availability: '/businesses/:businessId/services/:serviceId/availability',
  bookingReview: '/businesses/:businessId/services/:serviceId/review',
  bookingSent: '/businesses/:businessId/services/:serviceId/sent',
  appointments: '/appointments',
  signIn: '/sign-in',
  signUp: '/sign-up',
} as const

/** Destino de cada aba da navegação inferior. Sem destino = tela ainda não existe. */
export const NAVIGATION_PATHS: Partial<Record<NavigationItemId, string>> = {
  search: ROUTES.home,
  appointments: ROUTES.appointments,
  // TODO: "Perfil" ainda não tem tela.
}

/** Parâmetros de busca do fluxo de agendamento. `professional` ausente = "Sem preferência". */
export const SEARCH_PARAMS = {
  professional: 'professional',
  /** Início do horário escolhido: instante ISO 8601, em UTC — sem ambiguidade de fuso. */
  startsAt: 'startsAt',
  /** Id do agendamento criado. */
  appointment: 'appointment',
  /** Instante do envio do pedido, ISO 8601. */
  sentAt: 'sentAt',
  /** Para onde voltar depois de entrar ou criar conta. Só caminho interno. */
  redirect: 'redirect',
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

type BookingSearch = { professionalId: string; startsAt: string }

export const bookingReviewPath = (businessId: string, serviceId: string, booking: BookingSearch) =>
  withSearch(`${servicePath(businessId, serviceId)}/review`, {
    [SEARCH_PARAMS.professional]: booking.professionalId,
    [SEARCH_PARAMS.startsAt]: booking.startsAt,
  })

export const bookingSentPath = (
  businessId: string,
  serviceId: string,
  sent: { appointmentId: string; sentAt: string },
) =>
  withSearch(`${servicePath(businessId, serviceId)}/sent`, {
    [SEARCH_PARAMS.appointment]: sent.appointmentId,
    [SEARCH_PARAMS.sentAt]: sent.sentAt,
  })

/**
 * Só aceita caminho interno do app ("/appointments"). Recusa "//site.com" e URL absoluta:
 * um link montado por terceiros não pode levar o consumidor para fora depois de entrar.
 */
export const safeRedirect = (value: string | null) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : null

export const signInPath = (redirect?: string) =>
  withSearch(ROUTES.signIn, { [SEARCH_PARAMS.redirect]: redirect ?? null })

export const signUpPath = (redirect?: string | null) =>
  withSearch(ROUTES.signUp, { [SEARCH_PARAMS.redirect]: redirect ?? null })
