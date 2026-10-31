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
  panelExceptions: (businessId: string) => ['panel', businessId, 'schedule-exceptions'] as const,
}

/** O que pertence a uma conta: sai do cache ao entrar, sair ou trocar de conta. */
export const ACCOUNT_SCOPED_KEYS = [queryKeys.appointments, queryKeys.me, queryKeys.allPanels]
