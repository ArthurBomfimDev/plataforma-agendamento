import type {
  AddScheduleExceptionRequest,
  AffectedAppointmentResponse,
  AppointmentResponse,
  AuthResponse,
  AvailabilityCalendarResponse,
  AvailableSlotsResponse,
  BusinessDetailResponse,
  BusinessSearchItemResponse,
  ContextTokenResponse,
  CounterAppointmentRequest,
  CreateProfessionalRequest,
  CurrentUserResponse,
  CustomerResponse,
  GeoPlaceResponse,
  PagedResult,
  PostalCodeResponse,
  ProfessionalResponse,
  PublicBusinessResponse,
  PublicProfessionalResponse,
  PublicServiceResponse,
  RequestAppointmentRequest,
  ReverseGeocodeResponse,
  SaveServiceRequest,
  SaveWorkScheduleRequest,
  ScheduleExceptionResponse,
  ServiceResponse,
  UpdateProfessionalRequest,
  UpdateSchedulingPolicyRequest,
  UserResponse,
  WorkScheduleResponse,
} from './types'

import { api } from './client'
import { roundCoordinate } from '@lib/zustand/location'

const query = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString()

const enc = encodeURIComponent

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (email: string, password: string, fullName: string) =>
    api<UserResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password, fullName },
    }),
  logout: (refreshToken: string) =>
    api<void>('/api/auth/logout', { method: 'POST', body: { refreshToken } }),
  confirmEmail: (token: string) =>
    api<void>('/api/auth/confirm-email', { method: 'POST', body: { token } }),
  /** Sempre 202, exista a conta ou não. */
  resendConfirmation: (email: string) =>
    api<void>('/api/auth/resend-confirmation', { method: 'POST', body: { email } }),
  /** Sempre 202, exista a conta ou não. */
  forgotPassword: (email: string) =>
    api<void>('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, newPassword: string) =>
    api<void>('/api/auth/reset-password', { method: 'POST', body: { token, newPassword } }),
  me: () => api<CurrentUserResponse>('/api/users/me', { auth: true }),
  /** Painel de um estabelecimento (com `businessId`) ou consumidor (`null`). */
  switchContext: (businessId: string | null) =>
    api<ContextTokenResponse>('/api/users/me/context', {
      method: 'POST',
      auth: true,
      body: { businessId },
    }),
}

/**
 * Painel do estabelecimento. O estabelecimento vem do token (contexto), nunca da URL: o dono vê a
 * agenda toda; o profissional, só a própria — a API filtra.
 */
const panel = '/api/businesses/current'

export const panelApi = {
  /** Só o dono. */
  business: () => api<BusinessDetailResponse>(panel, { auth: true }),
  professionals: () =>
    api<PagedResult<ProfessionalResponse>>(`${panel}/professionals?pageSize=50`, { auth: true }),
  workSchedules: (professionalId: string) =>
    api<PagedResult<WorkScheduleResponse>>(
      `${panel}/work-schedules?${query({ professionalId, pageSize: 50 })}`,
      { auth: true },
    ),
  agenda: (date: string) =>
    api<PagedResult<AppointmentResponse>>(
      `${panel}/appointments?${query({ date, pageSize: 100 })}`,
      { auth: true },
    ),
  /** Semana e mês (7CF): de `date` a `to`, inclusivo, até 42 dias. */
  agendaRange: (from: string, to: string, page: number) =>
    api<PagedResult<AppointmentResponse>>(
      `${panel}/appointments?${query({ date: from, to, page, pageSize: 100 })}`,
      { auth: true },
    ),
  pending: (professionalId?: string) =>
    api<PagedResult<AppointmentResponse>>(
      `${panel}/appointments/pending?${query({ professionalId, pageSize: 50 })}`,
      { auth: true },
    ),
  confirm: (appointmentId: string) =>
    api<AppointmentResponse>(`${panel}/appointments/${enc(appointmentId)}/confirm`, {
      method: 'POST',
      auth: true,
    }),
  reject: (appointmentId: string, reason: string | null = null) =>
    api<AppointmentResponse>(`${panel}/appointments/${enc(appointmentId)}/reject`, {
      method: 'POST',
      auth: true,
      body: { reason },
    }),
  cancel: (appointmentId: string, reason: string | null = null) =>
    api<AppointmentResponse>(`${panel}/appointments/${enc(appointmentId)}/cancel`, {
      method: 'POST',
      auth: true,
      body: { reason },
    }),
  complete: (appointmentId: string) =>
    api<AppointmentResponse>(`${panel}/appointments/${enc(appointmentId)}/complete`, {
      method: 'POST',
      auth: true,
    }),
  noShow: (appointmentId: string) =>
    api<AppointmentResponse>(`${panel}/appointments/${enc(appointmentId)}/no-show`, {
      method: 'POST',
      auth: true,
    }),
  counter: (request: CounterAppointmentRequest) =>
    api<AppointmentResponse>(`${panel}/appointments/counter`, {
      method: 'POST',
      auth: true,
      body: request,
    }),
  /** Serviços do catálogo, ativos e inativos: a marcação de balcão e a tela de Serviços. */
  services: () =>
    api<PagedResult<ServiceResponse>>(`${panel}/services?pageSize=50`, { auth: true }),
}

/**
 * Gestão do estabelecimento (Onda 7D): catálogo, equipe, jornadas, bloqueios, imagens e política. Toda
 * escrita aqui é só do dono — a API responde 403 `auth.forbidden` ao profissional.
 */
export const manageApi = {
  createService: (request: SaveServiceRequest) =>
    api<ServiceResponse>(`${panel}/services`, { method: 'POST', auth: true, body: request }),
  updateService: (serviceId: string, request: SaveServiceRequest) =>
    api<ServiceResponse>(`${panel}/services/${enc(serviceId)}`, {
      method: 'PUT',
      auth: true,
      body: request,
    }),
  /** Habilita o profissional no serviço, com o preço e a duração do serviço. */
  enableProfessional: (serviceId: string, professionalId: string) =>
    api<ServiceResponse>(
      `${panel}/services/${enc(serviceId)}/professionals/${enc(professionalId)}`,
      {
        method: 'PUT',
        auth: true,
        body: { priceOverrideCents: null, durationOverrideMinutes: null },
      },
    ),
  disableProfessional: (serviceId: string, professionalId: string) =>
    api<void>(`${panel}/services/${enc(serviceId)}/professionals/${enc(professionalId)}`, {
      method: 'DELETE',
      auth: true,
    }),
  createProfessional: (request: CreateProfessionalRequest) =>
    api<ProfessionalResponse>(`${panel}/professionals`, {
      method: 'POST',
      auth: true,
      body: request,
    }),
  updateProfessional: (professionalId: string, request: UpdateProfessionalRequest) =>
    api<ProfessionalResponse>(`${panel}/professionals/${enc(professionalId)}`, {
      method: 'PUT',
      auth: true,
      body: request,
    }),
  addWorkSchedule: (professionalId: string, request: SaveWorkScheduleRequest) =>
    api<WorkScheduleResponse>(`${panel}/work-schedules`, {
      method: 'POST',
      auth: true,
      body: { professionalId, ...request },
    }),
  updateWorkSchedule: (scheduleId: string, request: SaveWorkScheduleRequest) =>
    api<WorkScheduleResponse>(`${panel}/work-schedules/${enc(scheduleId)}`, {
      method: 'PUT',
      auth: true,
      body: request,
    }),
  removeWorkSchedule: (scheduleId: string) =>
    api<void>(`${panel}/work-schedules/${enc(scheduleId)}`, { method: 'DELETE', auth: true }),
  /** Bloqueios que ainda não terminaram, do mais próximo ao mais distante. */
  exceptions: () =>
    api<PagedResult<ScheduleExceptionResponse>>(`${panel}/schedule-exceptions?pageSize=50`, {
      auth: true,
    }),
  affectedAppointments: (params: {
    startsAt: string
    endsAt: string
    professionalId: string | null
  }) =>
    api<PagedResult<AffectedAppointmentResponse>>(
      `${panel}/schedule-exceptions/affected-appointments?${query({
        startsAt: params.startsAt,
        endsAt: params.endsAt,
        professionalId: params.professionalId ?? undefined,
        pageSize: 50,
      })}`,
      { auth: true },
    ),
  addException: (request: AddScheduleExceptionRequest) =>
    api<ScheduleExceptionResponse>(`${panel}/schedule-exceptions`, {
      method: 'POST',
      auth: true,
      body: request,
    }),
  removeException: (exceptionId: string) =>
    api<void>(`${panel}/schedule-exceptions/${enc(exceptionId)}`, {
      method: 'DELETE',
      auth: true,
    }),
  updatePolicy: (request: UpdateSchedulingPolicyRequest) =>
    api<BusinessDetailResponse>(`${panel}/scheduling-policy`, {
      method: 'PUT',
      auth: true,
      body: request,
    }),
  /** Logotipo e capa: o envio vai por `uploadFile` (progresso); aqui, só remover. */
  removeBusinessImage: (slot: 'logo' | 'cover') =>
    api<BusinessDetailResponse>(`${panel}/${slot}`, { method: 'DELETE', auth: true }),
  removeProfessionalPhoto: (professionalId: string) =>
    api<ProfessionalResponse>(`${panel}/professionals/${enc(professionalId)}/photo`, {
      method: 'DELETE',
      auth: true,
    }),
}

/** Caminhos de envio de imagem, para `uploadFile` (`multipart/form-data`, campo `file`). */
export const uploadPaths = {
  businessImage: (slot: 'logo' | 'cover') => `${panel}/${slot}`,
  professionalPhoto: (professionalId: string) =>
    `${panel}/professionals/${enc(professionalId)}/photo`,
}

export const customersApi = {
  me: () => api<CustomerResponse>('/api/customers/me', { auth: true }),
  register: (birthDate: string) =>
    api<CustomerResponse>('/api/customers/me', {
      method: 'POST',
      auth: true,
      body: { birthDate, socialName: null },
    }),
}

export const businessesApi = {
  search: (params: {
    latitude: number
    longitude: number
    radiusKm?: number
    /** Só a cidade (Onda 7C): o backend ignora o raio e compara sem acento, até 50 km do ponto. */
    city?: string
    term?: string
    category?: string
    maxPriceCents?: number
    sortBy?: string
  }) => api<PagedResult<BusinessSearchItemResponse>>(`/api/businesses/search?${query(params)}`),
  get: (businessId: string) => api<PublicBusinessResponse>(`/api/businesses/${enc(businessId)}`),
  services: (businessId: string) =>
    api<PagedResult<PublicServiceResponse>>(
      `/api/businesses/${enc(businessId)}/services?pageSize=50`,
    ),
  professionals: (businessId: string) =>
    api<PagedResult<PublicProfessionalResponse>>(
      `/api/businesses/${enc(businessId)}/professionals?pageSize=50`,
    ),
}

export const availabilityApi = {
  calendar: (
    businessId: string,
    params: { serviceId: string; professionalId: string; from: string; to: string },
  ) =>
    api<AvailabilityCalendarResponse>(
      `/api/businesses/${enc(businessId)}/availability/calendar?${query(params)}`,
    ),
  day: (businessId: string, params: { serviceId: string; professionalId: string; date: string }) =>
    api<AvailableSlotsResponse>(`/api/businesses/${enc(businessId)}/availability?${query(params)}`),
}

/**
 * Localização. O ponto do aparelho vai arredondado (3 casas) já daqui: a API arredonda de novo antes de falar
 * com o provedor, mas o dado exato não precisa sair do aparelho.
 */
export const geoApi = {
  postalCode: (postalCode: string) =>
    api<PostalCodeResponse>(`/api/geo/postal-code/${enc(postalCode)}`),
  search: (text: string) =>
    api<PagedResult<GeoPlaceResponse>>(`/api/geo/search?${query({ q: text })}`),
  reverse: (latitude: number, longitude: number) =>
    api<ReverseGeocodeResponse>(
      `/api/geo/reverse?${query({ lat: roundCoordinate(latitude), lng: roundCoordinate(longitude) })}`,
    ),
}

export const appointmentsApi = {
  request: (request: RequestAppointmentRequest) =>
    api<AppointmentResponse>('/api/appointments', { method: 'POST', auth: true, body: request }),
  mine: () =>
    api<PagedResult<AppointmentResponse>>('/api/appointments/mine?pageSize=50', { auth: true }),
  cancel: (appointmentId: string) =>
    api<AppointmentResponse>(`/api/appointments/${enc(appointmentId)}/cancel`, {
      method: 'POST',
      auth: true,
      body: { reason: null },
    }),
}
