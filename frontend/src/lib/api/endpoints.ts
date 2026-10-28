import type {
  AppointmentResponse,
  AuthResponse,
  AvailabilityCalendarResponse,
  AvailableSlotsResponse,
  BusinessSearchItemResponse,
  CustomerResponse,
  PagedResult,
  PublicBusinessResponse,
  PublicProfessionalResponse,
  PublicServiceResponse,
  RequestAppointmentRequest,
  UserResponse,
} from './types'

import { api } from './client'

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
  me: () => api<UserResponse>('/api/users/me', { auth: true }),
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
  search: (params: { latitude: number; longitude: number; radiusKm?: number; term?: string }) =>
    api<PagedResult<BusinessSearchItemResponse>>(`/api/businesses/search?${query(params)}`),
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
