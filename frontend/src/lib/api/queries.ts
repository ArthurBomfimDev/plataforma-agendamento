import { appointmentsApi, authApi, availabilityApi, businessesApi, customersApi } from './endpoints'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import type { RequestAppointmentRequest } from './types'
import { useSessionStore } from '@lib/zustand/session'

/** Chaves do cache. Invalidar por prefixo: `['appointments']` derruba todas as listas. */
export const queryKeys = {
  search: (latitude: number, longitude: number, term?: string) =>
    ['businesses', 'search', latitude, longitude, term ?? ''] as const,
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

export const useSearchBusinesses = (
  location: { latitude: number; longitude: number } | null,
  term?: string,
) =>
  useQuery({
    queryKey: queryKeys.search(location?.latitude ?? 0, location?.longitude ?? 0, term),
    queryFn: () =>
      businessesApi.search({
        latitude: location!.latitude,
        longitude: location!.longitude,
        radiusKm: 20,
        term,
      }),
    enabled: location !== null,
  })

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

/** Entrar: guarda a sessão e limpa o cache de quem estava antes. */
export const useSignIn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (auth) => {
      queryClient.removeQueries({ queryKey: ['appointments'] })
      queryClient.removeQueries({ queryKey: queryKeys.me })
      useSessionStore.getState().setSession(auth)
    },
  })
}

/** Criar conta de consumidor: conta, sessão e perfil de consumidor, nessa ordem. */
export const useSignUp = () => {
  const signIn = useSignIn()
  return useMutation({
    mutationFn: async (values: {
      fullName: string
      email: string
      password: string
      birthDate: string
    }) => {
      await authApi.register(values.email, values.password, values.fullName)
      await signIn.mutateAsync({ email: values.email, password: values.password })
      await customersApi.register(values.birthDate)
    },
  })
}

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
