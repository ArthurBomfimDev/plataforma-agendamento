import type { TimeSlotOption } from '@components/time-slot-group/types'

export type DayPeriod = 'morning' | 'afternoon' | 'evening'

export type DaySlots = Record<DayPeriod, TimeSlotOption[]>

export type AvailabilityScreenProps = {
  businessId: string
  serviceId: string
  /** `null` = "Sem preferência". */
  professionalId: string | null
  /** Data de hoje no fuso do estabelecimento. Dias anteriores aparecem como passados. */
  today: Date
  onBack?: () => void
  /** Trilha do desktop: volta à página do estabelecimento. */
  onOpenBusiness?: () => void
  onContinue?: (date: Date, time: string) => void
}
