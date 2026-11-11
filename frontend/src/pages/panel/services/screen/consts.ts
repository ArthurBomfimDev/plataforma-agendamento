import type { ServiceListItem } from './types'
import { formatCents } from '@pages/panel/services/components/service-form/consts'

/** Ativos primeiro, depois por nome: o que está na vitrine é o que o dono mais mexe. */
export const byActiveThenName = (a: ServiceListItem, b: ServiceListItem) =>
  Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, 'pt-BR')

export const serviceSummary = (service: ServiceListItem) =>
  `${service.durationMinutes} min · ${formatCents(service.priceCents)}`

/** Selo de situação em cartão (a tela de Equipe também usa). Além da cor, o texto diz o estado. */
export const ACTIVE_BADGE = {
  true: 'bg-(--status-confirmed-bg) text-(--status-confirmed-fg)',
  false: 'bg-(--status-cancelled-bg) text-(--status-cancelled-fg)',
} as const

export const BADGE =
  'type-caption shrink-0 rounded-(--radius-full) px-(--space-8) py-(--space-2) whitespace-nowrap'

/** Selo do estado, com a mesma borda do Figma. Além da cor, o texto diz o estado. */
export const STATE_BADGE = {
  true: 'border-(--status-confirmed-fg) bg-(--status-confirmed-bg) text-(--status-confirmed-fg)',
  false: 'border-(--border-interactive) bg-(--bg-surface-raised) text-(--text-muted)',
} as const

export const STATE_LABEL = { true: 'Ativo', false: 'Pausado' } as const

/** Faixa de aviso do topo (Figma 18): uma linha, com a borda à esquerda mais grossa. */
export const SERVICES_ALERT =
  'type-label rounded-(--radius-sm) border border-l-3 border-(--status-pending-fg) bg-(--status-pending-bg) py-(--space-12) pr-(--space-12) pl-3.5 text-(--status-pending-fg)'

/** Sem profissional, o serviço não aparece para o consumidor: é o que o aviso do topo conta. */
export const withoutProfessional = (services: ServiceListItem[]) =>
  services.filter(({ isActive, professionalNames }) => isActive && professionalNames.length === 0)

export const alertMessage = (names: string[]) =>
  `${names.length} ${names.length === 1 ? 'serviço sem profissional designado não aparece' : 'serviços sem profissional designado não aparecem'} para quem busca — ${names.join(', ')}.`

export const subtitleOf = (services: ServiceListItem[], businessName: string) => {
  const active = services.filter(({ isActive }) => isActive).length
  const paused = services.length - active
  return [
    `${active} ${active === 1 ? 'ativo' : 'ativos'}`,
    ...(paused > 0 ? [`${paused} ${paused === 1 ? 'pausado' : 'pausados'}`] : []),
    businessName,
  ].join(' · ')
}

export const professionalCount = (count: number) =>
  `${count} ${count === 1 ? 'profissional' : 'profissionais'}`

/** Iniciais para o avatar: primeira letra do primeiro e do último nome. */
export const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : ''}`.toUpperCase()
}

export const MAX_AVATARS = 3
