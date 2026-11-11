import type {
  AppointmentResponse,
  AppointmentStatusResponse,
  BusinessSearchItemResponse,
  MyReviewResponse,
  PublicBusinessResponse,
  PublicProfessionalResponse,
  PublicServiceResponse,
} from '@api/models'
import { dateKeyIn, timeIn } from '@utils/time-zone'

import { REVIEW_WINDOW_DAYS } from './appointments/screen/consts'

import type { AppointmentStatus } from '@components/status-chip/types'
import type { BusinessDetail } from './business-detail/screen/types'
import type { BusinessProfessional } from './booking/choose-professional/screen/types'
import type { CustomerAppointment } from './appointments/screen/types'
import type { DaySlots } from './booking/availability/screen/types'
import type { HomeEstablishment } from './home/screen/types'
import type { SearchResult } from './search/screen/types'

/**
 * Conversão da resposta da API para o tipo que cada tela recebe. As telas não conhecem a API:
 * mudou o contrato, muda aqui.
 */

const REVIEW_WINDOW_MS = REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000

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
  // Sem média (menos de 3 avaliações) o card diz "Novo".
  rating: item.ratingAverage ?? undefined,
  reviewCount: item.ratingCount,
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
  rating: { average: item.ratingAverage, count: item.ratingCount },
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
  photos: business.photos,
  logo: business.logo,
  street: streetLine(business),
  neighborhood: business.address.district ?? business.address.city ?? '',
  confirmationHours: business.pendingExpirationHours,
  services: services.map(({ id, name, durationMinutes, priceCents, photo }) => ({
    id,
    name,
    durationMinutes,
    priceCents,
    photo,
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
  review: MyReviewResponse | null = null,
  now: Date = new Date(),
): CustomerAppointment => {
  const timeZone = business?.timeZone ?? fallbackTimeZone
  const street = business ? streetLine(business) : ''
  return {
    id: appointment.id,
    businessName: business?.name ?? 'Estabelecimento',
    // A miniatura é quadrada: o logotipo primeiro, como na revisão do pedido.
    businessImage: business ? (business.logo ?? business.cover) : null,
    category: business?.category,
    serviceName: appointment.serviceName,
    status: STATUS[appointment.status],
    date: dateKeyIn(appointment.startsAt, timeZone),
    time: timeIn(appointment.startsAt, timeZone),
    durationMinutes: appointment.durationMinutes,
    timeZone,
    address: street || undefined,
    expiresAt: appointment.expiresAt ? new Date(appointment.expiresAt) : undefined,
    // Avaliável: concluído, ainda sem avaliação e até 30 dias depois do fim. A conclusão exata o servidor confere
    // (`review.window_expired`); o fim do horário é o que a tela conhece e nunca é depois da conclusão.
    reviewable:
      appointment.status === 'Completed' &&
      review === null &&
      now.getTime() <= new Date(appointment.endsAt).getTime() + REVIEW_WINDOW_MS,
    review,
    sensitive: business?.category === 'Saude',
  }
}
