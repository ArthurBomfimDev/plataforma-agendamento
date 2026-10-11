import type { DaySlots } from './types'
import type { CalendarDayInfo } from '@components/availability-calendar/types'
import { format } from 'date-fns'

/**
 * Dados PROVISÓRIOS, copiados do wireframe "05 · Calendário e horários" do Figma.
 * Não são dado real nem cálculo real: substituem o `AvailabilityCalculator`, que mora no backend.
 * Saem quando existir a consulta de disponibilidade em `src/lib/api`.
 */

/** O "hoje" do wireframe: sexta, 4 de setembro de 2026. Sem ele, setembro inteiro já seria passado. */
export const MOCK_TODAY = new Date(2026, 8, 4)

/** Prazo de confirmação do estabelecimento, em horas. */
export const MOCK_CONFIRMATION_HOURS = 12

/** Meses navegáveis a partir do mês de hoje. */
export const MOCK_MONTHS_AHEAD = 2

const CLOSED_WEEKDAYS = [0] // domingo

const HOLIDAYS: Record<string, { name: string; closed: boolean }> = {
  '2026-09-07': { name: 'Independência', closed: true },
  '2026-10-12': { name: 'Nossa Senhora Aparecida', closed: true },
  '2026-11-02': { name: 'Finados', closed: true },
  '2026-11-15': { name: 'Proclamação da República', closed: true },
  '2026-11-20': { name: 'Consciência Negra', closed: true },
}

/** Dias abertos, mas já sem nenhum horário livre (anel vazado no calendário). */
const FULLY_BOOKED = ['2026-09-09', '2026-09-18', '2026-09-25']

const quarterHours = (startHour: number, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const minutes = startHour * 60 + index * 15
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  })

const SLOTS: DaySlots = {
  morning: ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '11:15'].map((time) => ({
    time,
    unavailable: time === '10:00',
  })),
  afternoon: quarterHours(13, 12).map((time) => ({ time })),
  evening: quarterHours(18, 4).map((time) => ({ time })),
}

const dateKey = (date: Date) => format(date, 'yyyy-MM-dd')

export const getMockDayInfo = (date: Date, today: Date): CalendarDayInfo => {
  const holiday = HOLIDAYS[dateKey(date)]
  const holidayInfo = holiday ? { holiday: { name: holiday.name } } : {}

  if (date < today) return { status: 'past', ...holidayInfo }
  if (holiday?.closed || CLOSED_WEEKDAYS.includes(date.getDay())) {
    return { status: 'closed', ...holidayInfo }
  }
  if (FULLY_BOOKED.includes(dateKey(date))) return { status: 'no-slots', ...holidayInfo }
  return { status: 'available', ...holidayInfo }
}

export const getMockDaySlots = (date: Date, today: Date): DaySlots | null =>
  getMockDayInfo(date, today).status === 'available' ? SLOTS : null
