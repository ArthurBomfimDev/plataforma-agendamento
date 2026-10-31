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

export type BusinessRole = 'Owner' | 'Professional'

/** Estabelecimento em que a conta tem vínculo ativo: um item do seletor de contexto. */
export type UserBusinessResponse = { businessId: string; name: string; role: BusinessRole }

/** `GET /api/users/me` (Onda 7A): a conta e os contextos que ela pode abrir. */
export type CurrentUserResponse = UserResponse & {
  hasCustomerProfile: boolean
  businesses: UserBusinessResponse[]
}

/** `POST /api/users/me/context`. Sem `businessId`, o token volta a ser de consumidor. */
export type ContextTokenResponse = {
  accessToken: string
  accessTokenExpiresAt: string
  businessId: string | null
  role: BusinessRole | null
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
  /** Nulas sem imagem: a tela mostra o padrão visual da categoria. */
  logo: ImageSet | null
  cover: ImageSet | null
}

/**
 * Uma imagem em três tamanhos WebP (ADR-023): 160, 640 e 1280 px no lado maior. Relativas (`/media/…`) ou
 * absolutas; quem resolve é `mediaUrl`.
 */
export type ImageSet = { small: string; medium: string; large: string }

export type BusinessSearchItemResponse = {
  id: string
  name: string
  category: string
  verified: boolean
  district: string | null
  city: string | null
  distanceKm: number
  /** Serviço em destaque: o que casa com o termo, ou o mais barato. Nulos sem serviço ativo. */
  serviceId: string | null
  serviceName: string | null
  durationMinutes: number | null
  /** "A partir de", em centavos. */
  fromPriceCents: number | null
  logo: ImageSet | null
  cover: ImageSet | null
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

/** Sem consentimento do profissional, só o nome vem preenchido — a foto também vem nula. */
export type PublicProfessionalResponse = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  photo: ImageSet | null
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
  /** Quando o pedido foi feito. O prazo de resposta conta daqui. */
  requestedAt: string
  /**
   * Só nas rotas do estabelecimento: nome social do consumidor, senão o do cadastro; no balcão, o
   * nome informado. Nulo nas rotas do consumidor.
   */
  customerName?: string | null
}

// --- Painel do estabelecimento (`businesses/current/*`) ---

export type SchedulingPolicyResponse = {
  autoConfirm: boolean
  pendingExpirationHours: number
  minLeadTimeHours: number
  bookingHorizonDays: number
  cancellationWindowHours: number
  timeZone: string
}

/** Visão do dono. Só os campos que o painel usa. */
export type BusinessDetailResponse = {
  id: string
  name: string
  /** `Beleza` ou `Saude`. `Saude` exige o tratamento de dado sensível (LGPD Art. 11). */
  category: string
  status: string
  policy: SchedulingPolicyResponse
  logo: ImageSet | null
  cover: ImageSet | null
}

export type UpdateSchedulingPolicyRequest = Omit<SchedulingPolicyResponse, 'timeZone'> & {
  timeZone: string | null
}

export type ProfessionalResponse = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  isActive: boolean
  /** Perfil completo (especialidade, bio, foto) na vitrine: exige o consentimento do profissional. */
  isPubliclyVisible: boolean
  hasPublicProfileConsent: boolean
  /** Vínculo com uma conta. Nulo: profissional sem login (o dono cadastrou). */
  membershipId: string | null
  photo: ImageSet | null
}

export type CreateProfessionalRequest = {
  displayName: string
  specialty: string | null
  bio: string | null
  /** O dono também atende: liga o profissional à própria conta. */
  isMe: boolean
}

export type UpdateProfessionalRequest = {
  displayName: string
  specialty: string | null
  bio: string | null
  isActive: boolean
  showFullProfile: boolean
}

/** Visão do painel: com intervalos, passo e nota de insumos, que a vitrine não mostra. */
export type ServiceResponse = PublicServiceResponse & {
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  slotStepMinutes: number
  suppliesNote: string | null
  isActive: boolean
}

export type SaveServiceRequest = {
  name: string
  description: string | null
  durationMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  slotStepMinutes: number
  priceCents: number
  suppliesNote: string | null
  isActive: boolean
}

/** Dia: 0 = domingo. Horários `HH:mm` no fuso do estabelecimento; datas `yyyy-MM-dd`. */
export type SaveWorkScheduleRequest = {
  dayOfWeek: number
  startTime: string
  endTime: string
  effectiveFrom: string
  effectiveTo: string | null
}

export type ScheduleExceptionKind = 'DayOff' | 'Vacation' | 'Block' | 'ExtraShift'

/** Sem profissional, vale para o estabelecimento inteiro. */
export type ScheduleExceptionResponse = {
  id: string
  professionalId: string | null
  kind: ScheduleExceptionKind
  startsAt: string
  endsAt: string
  reason: string | null
  cancelledAppointments: number
}

export type AddScheduleExceptionRequest = {
  professionalId: string | null
  kind: ScheduleExceptionKind
  startsAt: string
  endsAt: string
  reason: string | null
  /** `Keep` mantém os agendamentos do período; `CancelAll` cancela todos, com motivo. */
  existingAppointments: 'Keep' | 'CancelAll'
  cancellationReason: string | null
}

/** Agendamento que cairia dentro de um bloqueio: a prévia antes de gravar. */
export type AffectedAppointmentResponse = {
  id: string
  professionalId: string
  serviceName: string
  startsAt: string
  endsAt: string
  status: AppointmentStatusResponse
  attendeeName: string | null
}

/** `dayOfWeek` chega como número (0 = domingo, igual ao `Date.getDay()`); horários em `HH:mm:ss`. */
export type WorkScheduleResponse = {
  id: string
  professionalId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  effectiveFrom: string
  effectiveTo: string | null
}

export type CounterAppointmentRequest = {
  serviceId: string
  professionalId: string
  startsAt: string
  walkInName: string
  walkInPhone: string | null
  notes: string | null
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

// --- Localização (Onda 6B, `api/geo`) ---

export type LocationPrecision = 'Rooftop' | 'Street' | 'Locality' | 'City'

/** `GET /api/geo/postal-code/{cep}`. Logradouro e bairro faltam no CEP geral de cidade pequena. */
export type PostalCodeResponse = {
  postalCode: string
  street: string | null
  district: string | null
  city: string
  state: string
}

/** Um resultado de `GET /api/geo/search?q=` (até 5). */
export type GeoPlaceResponse = {
  label: string
  latitude: number
  longitude: number
  precision: LocationPrecision
  /** Cidade e sigla da UF, quando o provedor informa (Onda 7C). */
  city?: string | null
  state?: string | null
}

/** `GET /api/geo/reverse?lat=&lng=`. Cidade e UF quando o provedor informa (Onda 7C). */
export type ReverseGeocodeResponse = { label: string; city?: string | null; state?: string | null }
