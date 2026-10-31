import type { ServiceListItem } from './types'
import { formatCents } from '@pages/panel/services/components/service-form/consts'

/** Ativos primeiro, depois por nome: o que está na vitrine é o que o dono mais mexe. */
export const byActiveThenName = (a: ServiceListItem, b: ServiceListItem) =>
  Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, 'pt-BR')

export const serviceSummary = (service: ServiceListItem) =>
  `${service.durationMinutes} min · ${formatCents(service.priceCents)}`

/** Sem profissional, o serviço não tem horário para mostrar: dizemos isso em vez de uma lista vazia. */
export const professionalsLabel = (names: string[]) =>
  names.length === 0
    ? 'Nenhum profissional: o serviço não aparece para agendar.'
    : names.toSorted((a, b) => a.localeCompare(b, 'pt-BR')).join(', ')

/** Selo de situação. Além da cor, o texto diz o estado. */
export const ACTIVE_BADGE = {
  true: 'bg-(--status-confirmed-bg) text-(--status-confirmed-fg)',
  false: 'bg-(--status-cancelled-bg) text-(--status-cancelled-fg)',
} as const

export const BADGE =
  'type-caption shrink-0 rounded-(--radius-full) px-(--space-8) py-(--space-2) whitespace-nowrap'
