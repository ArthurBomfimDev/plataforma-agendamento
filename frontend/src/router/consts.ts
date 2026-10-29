import {
  DEFAULT_RADIUS_KM,
  EMPTY_SEARCH,
  SEARCH_CATEGORIES,
  SEARCH_RADII,
  type SearchFilters,
} from '@lib/api/search'

import type { NavigationItemId } from '@components/bottom-navigation/types'
import type { PanelBottomItem } from '@components/panel-bottom-navigation/types'
import type { PanelSection } from '@components/panel-sidebar/types'

export const ROUTES = {
  home: '/',
  business: '/businesses/:businessId',
  chooseProfessional: '/businesses/:businessId/services/:serviceId/professionals',
  availability: '/businesses/:businessId/services/:serviceId/availability',
  bookingReview: '/businesses/:businessId/services/:serviceId/review',
  bookingSent: '/businesses/:businessId/services/:serviceId/sent',
  appointments: '/appointments',
  /** Resultados da busca. Os filtros vão na URL (`?term=&category=&maxPrice=&sort=&radius=`). */
  search: '/search',
  signIn: '/sign-in',
  signUp: '/sign-up',
  /** "Confira seu e-mail", depois do cadastro. O endereço vai no estado da navegação, nunca na URL. */
  checkEmail: '/sign-up/check-email',
  forgotPassword: '/forgot-password',
  // Os dois caminhos abaixo estão nos e-mails da Onda 5B (contrato §4.1): não mudar sem mudar o e-mail.
  confirmEmail: '/confirmar-email',
  resetPassword: '/redefinir-senha',
  /** Painel do estabelecimento: agenda do dia (tela 09). */
  panel: '/panel',
  /** Painel do estabelecimento: pedidos pendentes (tela 10). */
  panelRequests: '/panel/requests',
  /** Painel do estabelecimento: cadastro de serviço (tela 11). Ainda não há lista de serviços. */
  panelNewService: '/panel/services/new',
  /**
   * Conta e troca de contexto (Onda 7A): "Consumidor" ou o painel de cada estabelecimento, e sair.
   * Também é a escolha depois de entrar, para quem tem mais de um estabelecimento.
   */
  chooseContext: '/context',
  // Os dois caminhos abaixo estão no e-mail ao dono (Onda 5B, `AppointmentNotifier`) e só redirecionam
  // para as rotas do painel: não mudar sem mudar o e-mail.
  emailPanelRequests: '/painel/pedidos',
  emailPanelAgenda: '/painel/agenda',
} as const

/** Destino de cada seção do painel. Sem destino = tela ainda não existe. */
export const PANEL_PATHS: Partial<Record<PanelSection | PanelBottomItem, string>> = {
  agenda: ROUTES.panel,
  requests: ROUTES.panelRequests,
  services: ROUTES.panelNewService,
  // No celular, "Mais" leva à conta: trocar de contexto e sair. As outras seções ainda não têm tela.
  more: ROUTES.chooseContext,
}

/** Seções que só o dono opera (catálogo, equipe, jornadas, configurações): o profissional não vê. */
export const OWNER_ONLY_SECTIONS: ReadonlyArray<PanelSection> = [
  'services',
  'professionals',
  'schedules',
  'settings',
]

/** Destino de cada aba da navegação inferior. Sem destino = tela ainda não existe. */
export const NAVIGATION_PATHS: Partial<Record<NavigationItemId, string>> = {
  search: ROUTES.home,
  appointments: ROUTES.appointments,
  // "Perfil" ainda não tem tela própria: leva à conta, com a troca de contexto e o sair.
  profile: ROUTES.chooseContext,
}

/** Estado da navegação para a tela de conta: por que a pessoa caiu nela. */
export type ChooseContextState = { reason?: 'panel' | 'customer' }

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
  /** Token de uso único dos links de confirmação e de redefinição (e-mails da Onda 5B). */
  token: 'token',
} as const

/** Estado da navegação para "Confira seu e-mail": o endereço e quando o último e-mail saiu. */
export type CheckEmailState = { email: string; sentAt: number }

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

export const searchPath = (filters: Partial<SearchFilters>) => {
  const { term, category, maxPriceCents, sortBy, radiusKm } = { ...EMPTY_SEARCH, ...filters }
  return withSearch(ROUTES.search, {
    term: term?.trim() || null,
    category,
    maxPrice: maxPriceCents === null ? null : String(maxPriceCents),
    sort: sortBy === 'distance' ? null : sortBy,
    radius: radiusKm === DEFAULT_RADIUS_KM ? null : String(radiusKm),
  })
}

/**
 * Lê os filtros da URL. Valor que não existe no backend (link editado à mão) é ignorado, em vez de virar
 * erro 400 na tela.
 */
export const readSearchFilters = (params: URLSearchParams): SearchFilters => {
  const category = params.get('category')
  const maxPrice = Number(params.get('maxPrice'))
  const radius = Number(params.get('radius'))
  const term = params.get('term')?.trim()

  return {
    term: term ? term.slice(0, 100) : null,
    category: SEARCH_CATEGORIES.find((c) => c === category) ?? null,
    maxPriceCents: Number.isInteger(maxPrice) && maxPrice > 0 ? maxPrice : null,
    sortBy: params.get('sort') === 'price' ? 'price' : 'distance',
    radiusKm: SEARCH_RADII.find((r) => r === radius) ?? DEFAULT_RADIUS_KM,
  }
}

export const checkEmailPath = (redirect?: string | null) =>
  withSearch(ROUTES.checkEmail, { [SEARCH_PARAMS.redirect]: redirect ?? null })
