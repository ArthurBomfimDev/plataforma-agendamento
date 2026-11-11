import type { CustomerHistory, PendingRequest } from './types'
import { differenceInMinutes, format, parse } from 'date-fns'
import { durationLabel, toMinutes, toTime } from '@pages/panel/agenda/screen/consts'

import type { Variants } from 'framer-motion'
import { priceFormat } from '@components/service-card/consts'
import { ptBR } from 'date-fns/locale/pt-BR'

/**
 * Abaixo disso o pedido ganha o destaque "urgente". TODO(figma): o wireframe não fixa o limite;
 * 8 h separa os exemplos (expira em 7 h é urgente, em 10 h não é).
 */
export const URGENT_REMAINING_MINUTES = 8 * 60

/** Minutos até o pedido expirar, pelo prazo da API. Zero ou menos = prazo encerrado. */
export const remainingMinutes = (request: PendingRequest, now: Date) =>
  differenceInMinutes(request.expiresAt, now)

/** O que expira primeiro vem primeiro. */
export const byDeadline = (a: PendingRequest, b: PendingRequest) =>
  a.expiresAt.getTime() - b.expiresAt.getTime()

/** "Primeira vez neste estabelecimento", "3 atendimentos · 1 falta". */
export const historyLabel = (history: CustomerHistory | null) => {
  if (!history) return 'Primeira vez neste estabelecimento'
  const { appointments, noShows } = history
  return `${appointments} ${appointments === 1 ? 'atendimento' : 'atendimentos'} · ${noShows} ${noShows === 1 ? 'falta' : 'faltas'}`
}

/** "Corte masculino · 30 min · R$ 45,00". */
export const serviceLabel = (request: PendingRequest) =>
  `${request.serviceName} · ${request.durationMinutes} min · ${priceFormat.format(request.priceCents / 100)}`

/** "sex, 11 set · 09:30 — 10:00". */
export const whenLabel = (request: PendingRequest) => {
  const day = parse(request.date, 'yyyy-MM-dd', new Date())
  // O `EEE` do pt-BR não abrevia todos os dias ("sábado"); as três letras são as do Figma.
  const weekday = format(day, 'EEEE', { locale: ptBR }).slice(0, 3)
  const end = toTime(toMinutes(request.start) + request.durationMinutes)
  return `${weekday}, ${format(day, 'd MMM', { locale: ptBR })} · ${request.start} — ${end}`
}

export const professionalLabel = (request: PendingRequest) =>
  request.professionalName ?? 'Sem preferência'

/** "expira em 11 h 46" ou, vencido, "prazo encerrado". */
export const expiryLabel = (remaining: number) =>
  remaining > 0 ? `expira em ${durationLabel(remaining)}` : 'prazo encerrado'

/** "pedido há 14 min". */
export const requestedLabel = (request: PendingRequest, now: Date) =>
  `pedido há ${durationLabel(Math.max(0, differenceInMinutes(now, request.requestedAt)))}`

/**
 * Entrada em cascata dos cards (o `custom` é a posição na lista) e saída para o lado ao aceitar ou
 * recusar. Quem pediu menos movimento no sistema vê só o esmaecer (`MotionConfig` da tela).
 */
export const CARD_MOTION = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut', delay: 0.05 + index * 0.07 },
  }),
  exit: { opacity: 0, x: 40, transition: { duration: 0.2 } },
} satisfies Variants

/** Marcador do Figma ("Badge"): sempre ícone + texto, nunca cor sozinha. */
export const MARKER =
  'type-caption tabular inline-flex shrink-0 items-center gap-(--space-4) rounded-sm px-(--space-8) py-(--space-2)'

export const OVERFLOW_MARKER = 'bg-(--bg-accent-soft) text-(--marker-overflow)'

export const URGENT_MARKER = 'bg-(--marker-urgent-bg) text-(--marker-urgent-fg)'
