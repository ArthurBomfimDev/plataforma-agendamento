import { EMPTY_SEARCH, type SearchFilters } from './business/search'

/** Chaves do cache. Invalidar por prefixo: `['appointments']` derruba todas as listas. */
export const queryKeys = {
  search: (
    latitude: number,
    longitude: number,
    filters: Partial<SearchFilters> & { city?: string | null },
  ) => ['businesses', 'search', latitude, longitude, { ...EMPTY_SEARCH, ...filters }] as const,
  business: (businessId: string) => ['businesses', businessId] as const,
  services: (businessId: string) => ['businesses', businessId, 'services'] as const,
  professionals: (businessId: string) => ['businesses', businessId, 'professionals'] as const,
  availability: ['availability'] as const,
  calendar: (
    businessId: string,
    serviceId: string,
    professionalId: string,
    from: string,
    to: string,
  ) => ['availability', businessId, serviceId, professionalId, 'calendar', from, to] as const,
  day: (businessId: string, serviceId: string, professionalId: string, date: string) =>
    ['availability', businessId, serviceId, professionalId, 'day', date] as const,
  appointments: ['appointments'] as const,
  myAppointments: ['appointments', 'mine'] as const,
  me: ['me'] as const,
  // Avaliações (ADR-032). As públicas moram sob `reviews`; as do consumidor, sob `appointments` (saem do cache ao trocar de conta).
  reviews: ['reviews'] as const,
  myReviews: ['appointments', 'reviews', 'mine'] as const,
  searches: ['businesses', 'search'] as const,
  businessRating: (businessId: string) => ['reviews', 'business', businessId, 'rating'] as const,
  businessReviews: (businessId: string, page: number) =>
    ['reviews', 'business', businessId, 'list', page] as const,
  professionalRating: (professionalId: string) =>
    ['reviews', 'professional', professionalId, 'rating'] as const,
  professionalReviews: (professionalId: string, page: number) =>
    ['reviews', 'professional', professionalId, 'list', page] as const,
  // Prévia do convite: o token só existe na memória e no link; a chave nunca vai a log.
  invitationPreview: (token: string) => ['invitation', 'preview', token] as const,
  // Cadastro do estabelecimento. A visão do dono mora sob o painel (trocar de contexto não mistura); o Admin, sob `admin`.
  ownerBusiness: (businessId: string) => ['panel', businessId, 'owner'] as const,
  ownerChecklist: (businessId: string) => ['panel', businessId, 'owner', 'checklist'] as const,
  professionalPage: (professionalId: string) => ['professionals', professionalId, 'page'] as const,
  adminProfessionalRemovals: (status: string) =>
    ['admin', 'professional-removals', status] as const,
  admin: ['admin'] as const,
  adminBusinesses: (status: string, category: string | null) =>
    ['admin', 'businesses', status, category] as const,
  adminBusiness: (businessId: string) => ['admin', 'business', businessId] as const,
  adminReports: (status: string) => ['admin', 'reports', status] as const,
  // O painel inteiro mora sob `['panel', businessId]`: trocar de contexto não mistura estabelecimentos.
  allPanels: ['panel'] as const,
  panel: (businessId: string) => ['panel', businessId] as const,
  panelAgenda: (businessId: string, date: string) => ['panel', businessId, 'agenda', date] as const,
  panelPending: (businessId: string) => ['panel', businessId, 'pending'] as const,
  panelAgendaRange: (businessId: string, from: string, to: string) =>
    ['panel', businessId, 'agenda-range', from, to] as const,
  panelBusiness: (businessId: string) => ['panel', businessId, 'business'] as const,
  panelProfessionals: (businessId: string) => ['panel', businessId, 'professionals'] as const,
  panelSchedules: (businessId: string, professionalId: string) =>
    ['panel', businessId, 'work-schedules', professionalId] as const,
  panelServices: (businessId: string) => ['panel', businessId, 'services'] as const,
  panelBusinessDetail: (businessId: string) => ['panel', businessId, 'business-detail'] as const,
  panelInvitations: (businessId: string) => ['panel', businessId, 'invitations'] as const,
  panelSeats: (businessId: string) => ['panel', businessId, 'seats'] as const,
  panelMyProfile: (businessId: string) => ['panel', businessId, 'my-profile'] as const,
  panelExceptions: (businessId: string) => ['panel', businessId, 'schedule-exceptions'] as const,
  panelReviews: (businessId: string, page: number) =>
    ['panel', businessId, 'reviews', page] as const,
  adminReviews: (status: string) => ['admin', 'reviews', status] as const,
}

/** O que pertence a uma conta: sai do cache ao entrar, sair ou trocar de conta. */
export const ACCOUNT_SCOPED_KEYS = [queryKeys.appointments, queryKeys.me, queryKeys.allPanels]
