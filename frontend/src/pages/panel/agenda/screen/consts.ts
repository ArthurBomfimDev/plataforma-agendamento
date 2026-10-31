import type {
  AgendaAction,
  AgendaAppointment,
  AgendaDay,
  AgendaEntry,
  AgendaProfessional,
  AgendaRow,
  AgendaSummary,
} from './types'
import { addDays, differenceInMinutes, format, parse } from 'date-fns'

import { ptBR } from 'date-fns/locale/pt-BR'

export const COUNTER_BOOKING_LABEL = '+ Marcação de balcão'

/** Quanto o dedo precisa deslizar (px) para trocar de profissional no celular. */
export const SWIPE_THRESHOLD = 80

export const shiftDay = (date: string, days: number) =>
  format(addDays(parse(date, 'yyyy-MM-dd', new Date()), days), 'yyyy-MM-dd')

export const ICON_BUTTON =
  'flex size-(--size-touch-min) shrink-0 items-center justify-center rounded-md text-(--text-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'

/** Entra pelo lado para onde se andou: +1 = da direita, -1 = da esquerda. */
export const SLIDE = {
  enter: (direction: number) => ({ x: direction * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -40, opacity: 0 }),
}

/**
 * Parte do expediente do dia ocupada por agendamentos, de 0 a 100: minutos agendados sobre os minutos de jornada,
 * descontados os bloqueios (almoço, folga). `null` sem expediente no dia. Somada da própria agenda — e, com filtro,
 * só do que está no recorte.
 */
export const occupancyOf = (professionals: ReadonlyArray<AgendaProfessional>) => {
  let available = 0
  let booked = 0
  for (const { workStart, workEnd, entries } of professionals) {
    const work = toMinutes(workEnd) - toMinutes(workStart)
    if (work <= 0) continue
    const minutesOf = (kind: AgendaEntry['kind']) =>
      entries
        .filter((entry) => entry.kind === kind)
        .reduce((sum, { durationMinutes }) => sum + durationMinutes, 0)
    available += Math.max(work - minutesOf('block'), 0)
    booked += minutesOf('appointment')
  }
  return available > 0 ? Math.min(100, Math.round((booked / available) * 100)) : null
}

/**
 * Indicadores do dia, no topo do desktop (tela 09), somados da agenda: não há endpoint de indicadores. Os três
 * primeiros são os do Figma. TODO(figma): o quarto do wireframe, tempo médio de resposta, precisa da hora em que o
 * pedido foi respondido, que a API não informa; no lugar dele, os confirmados do dia.
 */
export const summaryCards = (
  summary: AgendaSummary,
  occupancy: number | null,
  isToday: boolean,
) => [
  {
    label: isToday ? 'Agendamentos hoje' : 'Agendamentos do dia',
    value: String(summary.appointmentsCount),
    caption: summary.pendingCount === 1 ? '1 pendente' : `${summary.pendingCount} pendentes`,
    captionClassName: 'text-(--status-pending-fg)',
  },
  {
    label: 'Receita prevista',
    value: currencyFormat.format(summary.expectedRevenueCents / 100),
    caption: 'estimativa, não faturamento',
  },
  {
    label: 'Ocupação da agenda',
    value: occupancy === null ? '—' : `${occupancy}%`,
    caption: 'do expediente do dia',
  },
  {
    label: 'Confirmados',
    value: String(summary.confirmedCount),
    caption: 'prontos para atender',
    captionClassName: 'text-(--status-confirmed-fg)',
  },
]

/** Itens que ocupam a agenda e entram nos indicadores. */
export const summarize = (
  appointments: ReadonlyArray<{ status: AgendaAppointment['status']; priceCents: number }>,
): AgendaSummary => ({
  appointmentsCount: appointments.length,
  confirmedCount: appointments.filter(({ status }) => status === 'confirmed').length,
  pendingCount: appointments.filter(({ status }) => status === 'pending').length,
  expectedRevenueCents: appointments
    .filter(({ status }) => status !== 'no-show')
    .reduce((sum, { priceCents }) => sum + priceCents, 0),
})

/** Grade do desktop: 72px por hora, como na tela 09. */
export const PX_PER_MINUTE = 72 / 60

/** "09:30" → 570. */
export const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** 570 → "09:30". */
export const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export const entryEnd = (entry: AgendaEntry) => toMinutes(entry.start) + entry.durationMinutes

/** "1 h", "2 h 10", "40 min". */
export const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest}`
}

/** "1 h livre até 10:30", "2 h 10 livres até 13:00". */
export const freeLabel = (start: string, end: string) => {
  const minutes = toMinutes(end) - toMinutes(start)
  return `${durationLabel(minutes)} ${minutes === 60 ? 'livre' : 'livres'} até ${end}`
}

/**
 * Lista cronológica do celular: os itens em ordem, os intervalos livres dentro da jornada entre
 * eles e, no fim, o fim do expediente.
 */
export const buildRows = (professional: AgendaProfessional): AgendaRow[] => {
  const entries = [...professional.entries].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const workEnd = toMinutes(professional.workEnd)
  const rows: AgendaRow[] = []
  let cursor = toMinutes(professional.workStart)

  for (const entry of entries) {
    const start = toMinutes(entry.start)
    if (start > cursor) rows.push({ type: 'free', start: toTime(cursor), end: entry.start })
    rows.push({ type: 'entry', entry })
    cursor = Math.max(cursor, entryEnd(entry))
  }

  if (cursor < workEnd)
    rows.push({ type: 'free', start: toTime(cursor), end: professional.workEnd })
  rows.push({ type: 'off-hours', start: professional.workEnd })
  return rows
}

const parseDay = (date: string) => parse(date, 'yyyy-MM-dd', new Date())

/** "sexta, 11 de setembro" — sem o "-feira", como no Figma. */
export const dayLabel = (date: string) =>
  format(parseDay(date), "EEEE, d 'de' MMMM", { locale: ptBR }).replace('-feira', '')

/** "sexta, 11 de setembro de 2026". */
export const fullDayLabel = (date: string) => `${dayLabel(date)} de ${parseDay(date).getFullYear()}`

/** Primeiro nome, para o seletor do celular. */
export const firstName = (name: string) => name.split(' ')[0]

/** "Marina Souza" → "MS". */
export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

/** "11 h", "40 min". */
export const expiryLabel = (remainingMinutes: number) =>
  remainingMinutes >= 60 ? `${Math.floor(remainingMinutes / 60)} h` : `${remainingMinutes} min`

export const currencyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

/** Passo da remarcação e do encaixe. */
export const SNAP_MINUTES = 15

const overlaps = (start: number, end: number, entry: AgendaEntry) =>
  start < entryEnd(entry) && toMinutes(entry.start) < end

/** O item cabe ali? Dentro da jornada e sem sobrepor outro item (ele mesmo não conta). */
export const canPlace = (
  professional: AgendaProfessional,
  start: number,
  durationMinutes: number,
  ignoreId?: string,
) =>
  start >= toMinutes(professional.workStart) &&
  start + durationMinutes <= toMinutes(professional.workEnd) &&
  !professional.entries.some(
    (entry) => entry.id !== ignoreId && overlaps(start, start + durationMinutes, entry),
  )

/** Inícios possíveis, de 15 em 15 min, para um item dessa duração. */
export const placeableStarts = (
  professional: AgendaProfessional,
  durationMinutes: number,
  ignoreId?: string,
) => {
  const starts: string[] = []
  for (
    let start = toMinutes(professional.workStart);
    start + durationMinutes <= toMinutes(professional.workEnd);
    start += SNAP_MINUTES
  ) {
    if (canPlace(professional, start, durationMinutes, ignoreId)) starts.push(toTime(start))
  }
  return starts
}

export const findAppointment = (day: AgendaDay, id: string) => {
  for (const professional of day.professionals) {
    const entry = professional.entries.find((item) => item.id === id)
    if (entry?.kind === 'appointment') return { entry, professional }
  }
  return null
}

/** Minutos até o pedido expirar, pelo prazo que a API manda. Sem prazo = encerrado. */
export const minutesToExpire = (entry: AgendaAppointment, now: Date) =>
  entry.expiresAt ? differenceInMinutes(entry.expiresAt, now) : 0

/** Mensagem de sucesso de cada ação, na voz da tela 09. */
export const ACTION_SUCCESS: Record<AgendaAction, string> = {
  confirm: 'Agendamento confirmado',
  reject: 'Pedido recusado. O horário voltou a ficar livre.',
  cancel: 'Agendamento cancelado. O consumidor será avisado.',
  complete: 'Atendimento concluído',
  noShow: 'Falta registrada',
}
