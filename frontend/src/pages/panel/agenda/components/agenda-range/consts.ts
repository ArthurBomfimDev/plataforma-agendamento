import { format, parse } from 'date-fns'

import type { RangeAppointment } from './types'
import { ptBR } from 'date-fns/locale/pt-BR'

const day = (date: string) => parse(date, 'yyyy-MM-dd', new Date())

/** "seg, 3 nov". */
export const shortDayLabel = (date: string) =>
  format(day(date), 'EEE, d MMM', { locale: ptBR }).replaceAll('.', '')

/** "3 a 9 de novembro de 2026", ou "novembro de 2026" no mês. */
export const periodLabel = (view: 'week' | 'month', days: string[], date: string) => {
  if (view === 'month') return format(day(date), "MMMM 'de' yyyy", { locale: ptBR })
  const first = day(days[0]!)
  const last = day(days.at(-1)!)
  const sameMonth = first.getMonth() === last.getMonth()
  return sameMonth
    ? `${format(first, 'd')} a ${format(last, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
    : `${format(first, "d 'de' MMM", { locale: ptBR })} a ${format(last, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`.replaceAll(
        '.',
        '',
      )
}

export const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

/** Os agendamentos de cada dia, em ordem de horário. */
export const byDay = (appointments: RangeAppointment[]) => {
  const map = new Map<string, RangeAppointment[]>()
  for (const appointment of appointments.toSorted((a, b) => a.start.localeCompare(b.start))) {
    map.set(appointment.date, [...(map.get(appointment.date) ?? []), appointment])
  }
  return map
}

/** "3 agendamentos", "1 pendente": a contagem de um dia no mês, para o leitor de tela. */
export const dayCountLabel = (appointments: RangeAppointment[]) => {
  const pending = appointments.filter(({ status }) => status === 'pending').length
  const total = appointments.length === 1 ? '1 agendamento' : `${appointments.length} agendamentos`
  return pending > 0 ? `${total}, ${pending === 1 ? '1 pendente' : `${pending} pendentes`}` : total
}
