/**
 * Contrato da API, espelhado de `backend/src/Core/Booking.Arguments`. O JSON vem em camelCase.
 *
 * Datas: `DateOnly` chega como `yyyy-MM-dd`; `DateTimeOffset` como ISO 8601 com offset, em UTC.
 * Dinheiro sempre em centavos, inteiro.
 *
 * TODO: gerar estes tipos a partir do OpenAPI (`/openapi/v1.json`) em vez de copiar à mão.
 */

export type PagedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

// ---------- Identity ----------

export type AuthResponse = {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
}

export type UserResponse = {
  id: string
  email: string
  fullName: string
  emailConfirmed: boolean
}

// ---------- Tenancy ----------

export type AddressResponse = {
  street: string | null
  streetNumber: string | null
  district: string | null
  city: string | null
  state: string | null
  postalCode: string | null
}

export type PublicBusinessResponse = {
  id: string
  name: string
  category: string
  verified: boolean
  address: AddressResponse
  latitude: number | null
  longitude: number | null
  cancellationWindowHours: number
  pendingExpirationHours: number
  autoConfirm: boolean
  /** IANA, ex. `America/Sao_Paulo`. */
  timeZone: string
}

export type BusinessSearchItemResponse = {
  id: string
  name: string
  category: string
  verified: boolean
  district: string | null
  city: string | null
  distanceKm: number
}

// ---------- Catalog ----------

export type ServiceProfessionalResponse = {
  professionalId: string
  priceCents: number
  durationMinutes: number
  hasOverride: boolean
}

export type PublicServiceResponse = {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  priceCents: number
  professionals: ServiceProfessionalResponse[]
}

// ---------- People ----------

/** Sem consentimento do profissional, só o nome vem preenchido. */
export type PublicProfessionalResponse = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
}

export type CustomerResponse = {
  id: string
  birthDate: string
  socialName: string | null
}

// ---------- Availability ----------

export type AvailableSlotsResponse = {
  professionalId: string
  serviceId: string
  date: string
  timeZone: string
  holiday: string | null
  slots: string[]
}

export type AvailabilityDayResponse = {
  date: string
  /** O profissional tem jornada neste dia. Falso = fechado. */
  works: boolean
  slotCount: number
  holiday: string | null
}

export type AvailabilityCalendarResponse = {
  professionalId: string
  serviceId: string
  timeZone: string
  days: AvailabilityDayResponse[]
}

// ---------- Scheduling ----------

export type AppointmentStatusResponse =
  'Pending' | 'Confirmed' | 'Rejected' | 'Expired' | 'Cancelled' | 'Completed' | 'NoShow'

export type AppointmentResponse = {
  id: string
  businessId: string
  professionalId: string
  serviceId: string
  serviceName: string
  durationMinutes: number
  priceCents: number
  startsAt: string
  endsAt: string
  status: AppointmentStatusResponse
  source: string
  /** Só enquanto pendente: depois dele o pedido expira sozinho. */
  expiresAt: string | null
  attendeeName: string | null
  customerNotes: string | null
  cancellationReason: string | null
  cancelledBy: string | null
}

export type RequestAppointmentRequest = {
  businessId: string
  serviceId: string
  professionalId: string
  startsAt: string
  notes: string | null
  attendeeName: string | null
  /** Gerada aqui; repetir o envio devolve o mesmo agendamento em vez de criar dois. */
  idempotencyKey: string
}
