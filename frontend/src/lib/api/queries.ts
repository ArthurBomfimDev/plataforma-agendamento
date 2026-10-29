import {
  appointmentsApi,
  authApi,
  availabilityApi,
  businessesApi,
  customersApi,
  manageApi,
  panelApi,
} from './endpoints'
import type {
  AppointmentResponse,
  CounterAppointmentRequest,
  RequestAppointmentRequest,
  UserBusinessResponse,
} from './types'
import { EMPTY_SEARCH, type SearchFilters, searchArea } from './search'
import { clearPendingProfile, readPendingProfile, savePendingProfile } from './pending-profile'
import {
  type Entry,
  type EntryIntent,
  chooseEntry,
  forgetContexts,
  readLastContext,
  rememberContext,
} from './context'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from './errors'
import type { BusinessContext } from '@lib/zustand/session/types'
import { useSessionStore } from '@lib/zustand/session'

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
  calendar: (
    businessId: string,
    serviceId: string,
    professionalId: string,
    from: string,
    to: string,
  ) => ['availability', businessId, serviceId, professionalId, 'calendar', from, to] as const,
  day: (businessId: string, serviceId: string, professionalId: string, date: string) =>
    ['availability', businessId, serviceId, professionalId, 'day', date] as const,
  myAppointments: ['appointments', 'mine'] as const,
  me: ['me'] as const,
  // O painel inteiro mora sob `['panel', businessId]`: trocar de contexto não mistura estabelecimentos.
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

/** A agenda e os pedidos se atualizam sozinhos neste intervalo, sem recarregar a página. */
export const PANEL_REFRESH_MS = 30_000

/**
 * Busca perto da referência, com os filtros que o backend suporta. Sem referência, não busca. Em "Cidade",
 * manda a cidade da localização escolhida (`searchArea`).
 */
export const useSearchBusinesses = (
  location: { latitude: number; longitude: number; city?: string | null } | null,
  filters: Partial<SearchFilters> = {},
) => {
  const { term, category, maxPriceCents, sortBy, distance } = { ...EMPTY_SEARCH, ...filters }
  const { radiusKm, city } = searchArea(distance, location?.city)
  return useQuery({
    queryKey: queryKeys.search(location?.latitude ?? 0, location?.longitude ?? 0, {
      ...filters,
      distance,
      city: city ?? null,
    }),
    queryFn: () =>
      businessesApi.search({
        latitude: location!.latitude,
        longitude: location!.longitude,
        radiusKm,
        city,
        term: term ?? undefined,
        category: category ?? undefined,
        maxPriceCents: maxPriceCents ?? undefined,
        sortBy: sortBy === 'distance' ? undefined : sortBy,
      }),
    enabled: location !== null,
  })
}

export const useBusiness = (businessId: string) =>
  useQuery({
    queryKey: queryKeys.business(businessId),
    queryFn: () => businessesApi.get(businessId),
    enabled: businessId !== '',
  })

export const useServices = (businessId: string) =>
  useQuery({
    queryKey: queryKeys.services(businessId),
    queryFn: async () => (await businessesApi.services(businessId)).items,
    enabled: businessId !== '',
  })

export const useProfessionals = (businessId: string) =>
  useQuery({
    queryKey: queryKeys.professionals(businessId),
    queryFn: async () => (await businessesApi.professionals(businessId)).items,
    enabled: businessId !== '',
  })

/** Busca vários estabelecimentos de uma vez (a lista de agendamentos cita vários). */
export const useBusinesses = (businessIds: string[]) =>
  useQueries({
    queries: businessIds.map((businessId) => ({
      queryKey: queryKeys.business(businessId),
      queryFn: () => businessesApi.get(businessId),
    })),
  })

type AvailabilityTarget = { businessId: string; serviceId: string; professionalIds: string[] }

/** Calendário de um ou mais profissionais ("Sem preferência" consulta todos os habilitados). */
export const useAvailabilityCalendars = (
  { businessId, serviceId, professionalIds }: AvailabilityTarget,
  from: string,
  to: string,
) =>
  useQueries({
    queries: professionalIds.map((professionalId) => ({
      queryKey: queryKeys.calendar(businessId, serviceId, professionalId, from, to),
      queryFn: () => availabilityApi.calendar(businessId, { serviceId, professionalId, from, to }),
    })),
  })

export const useDaySlots = (
  { businessId, serviceId, professionalIds }: AvailabilityTarget,
  date: string | null,
) =>
  useQueries({
    queries: professionalIds.map((professionalId) => ({
      queryKey: queryKeys.day(businessId, serviceId, professionalId, date ?? ''),
      queryFn: () => availabilityApi.day(businessId, { serviceId, professionalId, date: date! }),
      enabled: date !== null,
    })),
  })

export const useMyAppointments = () => {
  const signedIn = useSessionStore((state) => state.session !== null)
  return useQuery({
    queryKey: queryKeys.myAppointments,
    queryFn: async () => (await appointmentsApi.mine()).items,
    enabled: signedIn,
  })
}

export const useRequestAppointment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestAppointmentRequest) => appointmentsApi.request(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
      // O horário pedido deixou de estar livre.
      void queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export const useCancelAppointment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (appointmentId: string) => appointmentsApi.cancel(appointmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
      void queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export const useMe = () => {
  const signedIn = useSessionStore((state) => state.session !== null)
  return useQuery({ queryKey: queryKeys.me, queryFn: authApi.me, enabled: signedIn })
}

/**
 * Entrar: guarda a sessão e limpa o cache de quem estava antes. Na primeira entrada depois do
 * cadastro, cria o perfil de consumidor guardado no cadastro (ver `pending-profile`).
 */
export const useSignIn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const auth = await authApi.login(email, password)
      queryClient.removeQueries({ queryKey: ['appointments'] })
      queryClient.removeQueries({ queryKey: queryKeys.me })
      queryClient.removeQueries({ queryKey: ['panel'] })
      useSessionStore.getState().setSession(auth)
      // Sessão nova começa como consumidor; o contexto de quem estava antes não vale para ela.
      useSessionStore.getState().setContext(auth.accessToken, auth.accessTokenExpiresAt, null)

      const birthDate = readPendingProfile(email)
      if (birthDate) {
        try {
          await customersApi.register(birthDate)
        } catch (error) {
          // Perfil já criado (outra aba, outra tentativa): segue. Outro erro não impede a entrada;
          // o agendamento pede o perfil depois, com mensagem própria.
          if (!(error instanceof ApiError) || error.code !== 'customer.already_registered') {
            return auth
          }
        }
        clearPendingProfile()
      }

      return auth
    },
  })
}

/**
 * Criar conta de consumidor. Desde a Onda 6A, o cadastro não abre sessão: a conta só entra depois de
 * confirmar o e-mail. A data de nascimento fica guardada para criar o perfil na primeira entrada.
 */
export const useSignUp = () =>
  useMutation({
    mutationFn: async (values: {
      fullName: string
      email: string
      password: string
      birthDate: string
    }) => {
      await authApi.register(values.email, values.password, values.fullName)
      savePendingProfile(values.email, values.birthDate)
    },
  })

export const useConfirmEmail = () =>
  useMutation({ mutationFn: (token: string) => authApi.confirmEmail(token) })

export const useResendConfirmation = () =>
  useMutation({ mutationFn: (email: string) => authApi.resendConfirmation(email) })

export const useForgotPassword = () =>
  useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) })

export const useResetPassword = () =>
  useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
  })

/**
 * Troca o contexto: painel de um estabelecimento ou consumidor (`null`). Guarda o novo token e lembra
 * a escolha para a próxima entrada.
 */
export const useSwitchContext = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      business,
    }: {
      userId: string
      business: UserBusinessResponse | null
    }) => {
      const token = await authApi.switchContext(business?.businessId ?? null)
      useSessionStore.getState().setContext(
        token.accessToken,
        token.accessTokenExpiresAt,
        business && {
          businessId: business.businessId,
          businessName: business.name,
          role: business.role,
        },
      )
      rememberContext(userId, business?.businessId ?? null)
      queryClient.removeQueries({ queryKey: ['panel'] })
      return token
    },
  })
}

/**
 * Depois de entrar: lê os contextos da conta, decide onde ela entra (`chooseEntry`) e, se for um
 * painel, já troca o token.
 */
export const useEnterAccount = () => {
  const queryClient = useQueryClient()
  const switchContext = useSwitchContext()
  return useMutation({
    mutationFn: async (intent: EntryIntent): Promise<Entry> => {
      const me = await queryClient.fetchQuery({ queryKey: queryKeys.me, queryFn: authApi.me })
      const entry = chooseEntry(me, readLastContext(me.id), intent)
      if (entry.kind === 'business') {
        await switchContext.mutateAsync({ userId: me.id, business: entry.business })
      }
      return entry
    },
  })
}

/** Contexto de estabelecimento ativo, ou `null` no de consumidor. */
export const useBusinessContext = () => useSessionStore((state) => state.context)

export const usePanelBusiness = (context: BusinessContext) =>
  useQuery({
    queryKey: queryKeys.panelBusiness(context.businessId),
    // O detalhe completo é só do dono; o profissional lê a vitrine, que tem o fuso e o prazo.
    queryFn: async () => {
      if (context.role === 'Owner') {
        const business = await panelApi.business()
        return {
          name: business.name,
          category: business.category,
          logo: business.logo,
          timeZone: business.policy.timeZone,
          pendingExpirationHours: business.policy.pendingExpirationHours,
          autoConfirm: business.policy.autoConfirm,
        }
      }
      const business = await businessesApi.get(context.businessId)
      return {
        name: business.name,
        category: business.category,
        logo: business.logo,
        timeZone: business.timeZone,
        pendingExpirationHours: business.pendingExpirationHours,
        autoConfirm: business.autoConfirm,
      }
    },
  })

/** Equipe ativa: quem aparece na agenda e no balcão. */
export const usePanelProfessionals = (businessId: string) =>
  useQuery({
    queryKey: queryKeys.panelProfessionals(businessId),
    queryFn: async () => (await panelApi.professionals()).items,
    select: (professionals) => professionals.filter(({ isActive }) => isActive),
  })

/** Equipe inteira, com quem foi desativado: a tela de Profissionais. Mesmo cache da equipe ativa. */
export const usePanelTeam = (businessId: string) =>
  useQuery({
    queryKey: queryKeys.panelProfessionals(businessId),
    queryFn: async () => (await panelApi.professionals()).items,
  })

/** Detalhe do estabelecimento para as telas de gestão (só o dono). */
export const usePanelBusinessDetail = (businessId: string) =>
  useQuery({
    queryKey: queryKeys.panelBusinessDetail(businessId),
    queryFn: () => panelApi.business(),
  })

export const usePanelExceptions = (businessId: string) =>
  useQuery({
    queryKey: queryKeys.panelExceptions(businessId),
    queryFn: async () => (await manageApi.exceptions()).items,
  })

/**
 * Uma escrita da gestão. Depois dela (também no erro: um 409 quer dizer que a tela está velha), o painel
 * inteiro do estabelecimento é buscado de novo — catálogo, equipe e jornada alimentam a agenda e o balcão.
 */
export const usePanelMutation = <TVariables, TResult>(
  businessId: string,
  mutationFn: (variables: TVariables) => Promise<TResult>,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.panel(businessId) }),
  })
}

export const usePanelWorkSchedules = (businessId: string, professionalIds: string[]) =>
  useQueries({
    queries: professionalIds.map((professionalId) => ({
      queryKey: queryKeys.panelSchedules(businessId, professionalId),
      queryFn: async () => (await panelApi.workSchedules(professionalId)).items,
    })),
  })

export const usePanelAgenda = (businessId: string, date: string) =>
  useQuery({
    queryKey: queryKeys.panelAgenda(businessId, date),
    queryFn: async () => (await panelApi.agenda(date)).items,
    refetchInterval: PANEL_REFRESH_MS,
  })

/**
 * Agenda de um período (semana ou mês, Onda 7CF). A API devolve até 100 por página; aqui busca as páginas até
 * completar, com teto de 10 (1.000 agendamentos), que um mês de um estabelecimento pequeno não alcança.
 */
export const usePanelAgendaRange = (
  businessId: string,
  from: string,
  to: string,
  enabled: boolean,
) =>
  useQuery({
    queryKey: queryKeys.panelAgendaRange(businessId, from, to),
    queryFn: async () => {
      const items: AppointmentResponse[] = []
      for (let page = 1; page <= 10; page++) {
        const result = await panelApi.agendaRange(from, to, page)
        items.push(...result.items)
        if (items.length >= result.totalCount || result.items.length === 0) break
      }
      return items
    },
    enabled,
    refetchInterval: PANEL_REFRESH_MS,
  })

export const usePanelPending = (businessId: string) =>
  useQuery({
    queryKey: queryKeys.panelPending(businessId),
    queryFn: () => panelApi.pending(),
    refetchInterval: PANEL_REFRESH_MS,
  })

export const usePanelServices = (businessId: string, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.panelServices(businessId),
    queryFn: async () => (await panelApi.services()).items,
    enabled,
  })

export type PanelAction = 'confirm' | 'reject' | 'cancel' | 'complete' | 'noShow'

/** Uma ação sobre um agendamento. Depois dela, agenda e pedidos são buscados de novo. */
export const usePanelAction = (businessId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ action, appointmentId }: { action: PanelAction; appointmentId: string }) =>
      panelApi[action](appointmentId),
    // Também no erro: um 409 quase sempre quer dizer que a lista na tela está velha.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.panel(businessId) }),
  })
}

export const useCounterBooking = (businessId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CounterAppointmentRequest) => panelApi.counter(request),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.panel(businessId) }),
  })
}

/** "Minha conta" (7CF): troca o nome e recarrega a conta (o menu mostra o nome novo). */
export const useUpdateMe = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fullName: string) => authApi.updateMe(fullName),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  })
}

/**
 * Troca a senha. A API devolve uma sessão nova (de consumidor) e encerra as outras: guarda a nova e, se o painel
 * estava aberto, pede o contexto de novo, como depois de uma renovação.
 */
export const useChangePassword = () =>
  useMutation({
    mutationFn: async ({ current, next }: { current: string; next: string }) => {
      const session = await authApi.changePassword(current, next)
      const store = useSessionStore.getState()
      const context = store.context
      store.setSession(session)
      if (context) {
        const token = await authApi.switchContext(context.businessId)
        useSessionStore
          .getState()
          .setContext(token.accessToken, token.accessTokenExpiresAt, context)
      }
    },
  })

export const useSignOut = () => {
  const queryClient = useQueryClient()
  return () => {
    const session = useSessionStore.getState().session
    useSessionStore.getState().signOut()
    forgetContexts()
    queryClient.removeQueries({ queryKey: ['appointments'] })
    queryClient.removeQueries({ queryKey: ['panel'] })
    queryClient.removeQueries({ queryKey: queryKeys.me })
    // Revoga o refresh token no servidor; se falhar, a sessão local já foi encerrada.
    if (session) void authApi.logout(session.refreshToken).catch(() => undefined)
  }
}
