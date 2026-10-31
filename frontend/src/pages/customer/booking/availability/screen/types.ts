import type { BusinessService } from '@pages/customer/business-detail/screen/types'
import type { CalendarDayInfo } from '@components/availability-calendar/types'
import type { TimeSlotOption } from '@components/time-slot-group/types'

export type DayPeriod = 'morning' | 'afternoon' | 'evening'

export type DaySlots = Record<DayPeriod, TimeSlotOption[]>

export type AvailabilityScreenProps = {
  businessName: string
  service: Omit<BusinessService, 'id'>
  /** `null` = "Sem preferência". */
  professionalName: string | null
  /** Data de hoje no fuso do estabelecimento. Dias anteriores aparecem como passados. */
  today: Date
  /** Meses navegáveis a partir do mês de hoje. */
  monthsAhead: number
  /** Em quantas horas o estabelecimento confirma o pedido. */
  confirmationHours: number
  getDayInfo: (date: Date) => CalendarDayInfo
  /** Dia escolhido. Quem busca os horários dele é a rota. */
  selectedDate: Date | undefined
  onSelectDate: (date: Date) => void
  /** Horários livres do dia escolhido. `null` = ainda carregando. */
  slots: DaySlots | null
  onBack?: () => void
  /** Trilha do desktop: volta à página do estabelecimento. */
  onOpenBusiness?: () => void
  onContinue?: (date: Date, time: string) => void
}
