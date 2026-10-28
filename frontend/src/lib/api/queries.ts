import { appointmentsApi, authApi, availabilityApi, businessesApi, customersApi } from './endpoints'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { clearPendingProfile, readPendingProfile, savePendingProfile } from './pending-profile'

import { EMPTY_SEARCH, type SearchFilters } from './search'

import { ApiError } from './errors'
import type { RequestAppointmentRequest } from './types'
import { useSessionStore } from '@lib/zustand/session'

/** Chaves do cache. Invalidar por prefixo: `['appointments']` derruba todas as listas. */
export const queryKeys = {
  search: (latitude: number, longitude: number, filters: Partial<SearchFilters>) =>
    ['businesses', 'search', latitude, longitude, { ...EMPTY_SEARCH, ...filters }] as const,
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
}

/** Busca perto da referência, com os filtros que o backend suporta. Sem referência, não busca. */
export const useSearchBusinesses = (
  location: { latitude: number; longitude: number } | null,
  filters: Partial<SearchFilters> = {},
) => {
  const { term, category, maxPriceCents, sortBy, radiusKm } = { ...EMPTY_SEARCH, ...filters }
  return useQuery({
    queryKey: queryKeys.search(location?.latitude ?? 0, location?.longitude ?? 0, filters),
    queryFn: () =>
      businessesApi.search({
        latitude: location!.latitude,
        longitude: location!.longitude,
        radiusKm,
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
      useSessionStore.getState().setSession(auth)

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

export const useSignOut = () => {
  const queryClient = useQueryClient()
  return () => {
    const session = useSessionStore.getState().session
    useSessionStore.getState().clearSession()
    queryClient.removeQueries({ queryKey: ['appointments'] })
    queryClient.removeQueries({ queryKey: queryKeys.me })
    // Revoga o refresh token no servidor; se falhar, a sessão local já foi encerrada.
    if (session) void authApi.logout(session.refreshToken).catch(() => undefined)
  }
}
