import type {
  AppointmentResponse,
  AppointmentStatusResponse,
  BusinessSearchItemResponse,
  PublicBusinessResponse,
  PublicProfessionalResponse,
  PublicServiceResponse,
} from '@lib/api/types'
import { dateKeyIn, timeIn } from '@lib/api/time'

import type { AppointmentStatus } from '@components/status-chip/types'
import type { BusinessDetail } from '@features/business-detail/types'
import type { BusinessProfessional } from '@features/choose-professional/types'
import type { CustomerAppointment } from '@features/appointments/types'
import type { DaySlots } from '@features/availability/types'
import type { HomeEstablishment } from '@features/home/types'
import type { SearchResult } from '@features/search-results/types'

/**
 * Conversão da resposta da API para o tipo que cada tela recebe. As telas não conhecem a API:
 * mudou o contrato, muda aqui.
 */

const streetLine = ({ address }: PublicBusinessResponse) =>
  [address.street, address.streetNumber].filter(Boolean).join(', ')

export const toHomeEstablishment = (item: BusinessSearchItemResponse): HomeEstablishment => ({
  id: item.id,
  name: item.name,
  distanceKm: item.distanceKm,
  neighborhood: item.district ?? item.city ?? '',
  verified: item.verified,
  // O card é largo: a capa primeiro; sem capa, o logotipo; sem nenhum, a ilustração da categoria.
  image: item.cover ?? item.logo,
  category: item.category,
  // TODO: nota e avaliações dependem do módulo Reputation, ainda sem endpoint público.
})

export const toSearchResult = (item: BusinessSearchItemResponse): SearchResult => ({
  id: item.id,
  name: item.name,
  distanceKm: item.distanceKm,
  neighborhood: item.district ?? item.city ?? '',
  verified: item.verified,
  category: item.category,
  // A miniatura é quadrada: o logotipo primeiro.
  image: item.logo ?? item.cover,
  cover: item.cover ?? item.logo,
  service:
    item.serviceName !== null && item.durationMinutes !== null && item.fromPriceCents !== null
      ? {
          name: item.serviceName,
          durationMinutes: item.durationMinutes,
          fromPriceCents: item.fromPriceCents,
        }
      : null,
})

export const toBusinessDetail = (
  business: PublicBusinessResponse,
  services: PublicServiceResponse[],
): BusinessDetail => ({
  id: business.id,
  name: business.name,
  verified: business.verified,
  category: business.category,
  cover: business.cover,
  logo: business.logo,
  street: streetLine(business),
  neighborhood: business.address.district ?? business.address.city ?? '',
  confirmationHours: business.pendingExpirationHours,
  services: services.map(({ id, name, durationMinutes, priceCents }) => ({
    id,
    name,
    durationMinutes,
    priceCents,
  })),
})

export const toProfessional = (professional: PublicProfessionalResponse): BusinessProfessional => ({
  id: professional.id,
  name: professional.displayName,
  specialty: professional.specialty ?? undefined,
  photo: professional.photo,
})

/** Manhã até 12h, tarde até 18h, noite depois — no fuso do estabelecimento. */
const periodOf = (time: string): keyof DaySlots => {
  const hour = Number(time.slice(0, 2))
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

/** Instantes livres (ISO, UTC) → horários `HH:mm` agrupados por período, no fuso dado. */
export const groupSlots = (instants: string[], timeZone: string): DaySlots => {
  const slots: DaySlots = { morning: [], afternoon: [], evening: [] }
  for (const instant of instants) {
    const time = timeIn(instant, timeZone)
    slots[periodOf(time)].push({ time })
  }
  return slots
}

/**
 * Os sete estados do agendamento viram os quatro que a tela já desenha. Recusado e expirado vão
 * para "cancelado" — nos dois o atendimento não acontece.
 * TODO(figma): Rejected, Expired e NoShow ganham chip próprio quando tiverem wireframe.
 */
const STATUS: Record<AppointmentStatusResponse, AppointmentStatus> = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Completed: 'completed',
  Cancelled: 'cancelled',
  Rejected: 'cancelled',
  Expired: 'cancelled',
  NoShow: 'cancelled',
}

export const toCustomerAppointment = (
  appointment: AppointmentResponse,
  business: PublicBusinessResponse | undefined,
  fallbackTimeZone: string,
): CustomerAppointment => {
  const timeZone = business?.timeZone ?? fallbackTimeZone
  const street = business ? streetLine(business) : ''
  return {
    id: appointment.id,
    businessName: business?.name ?? 'Estabelecimento',
    serviceName: appointment.serviceName,
    status: STATUS[appointment.status],
    date: dateKeyIn(appointment.startsAt, timeZone),
    time: timeIn(appointment.startsAt, timeZone),
    durationMinutes: appointment.durationMinutes,
    timeZone,
    address: street || undefined,
    expiresAt: appointment.expiresAt ? new Date(appointment.expiresAt) : undefined,
    // TODO: avaliação depende do módulo Reputation, ainda sem endpoint.
    reviewable: false,
  }
}
