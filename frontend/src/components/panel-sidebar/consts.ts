import { CalendarClock, CalendarDays, ImageIcon, Inbox, Settings, Tag, Users } from 'lucide-react'

import type { PanelSection } from './types'

/**
 * Ordem da tela 09 do Figma, sem Avaliações e Relatórios: não há backend para eles (fora do recorte,
 * `PROJECT-CONTEXT.md` §12), e item que não leva a lugar nenhum não fica no menu (Onda 7D). Ícones
 * do mesmo conjunto do app (lucide), escolhidos pelo que a seção faz.
 */
export const SECTIONS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'requests', label: 'Pedidos', icon: Inbox },
  { id: 'services', label: 'Serviços', icon: Tag },
  { id: 'professionals', label: 'Profissionais', icon: Users },
  { id: 'schedules', label: 'Jornadas e bloqueios', icon: CalendarClock },
  { id: 'photos', label: 'Fotos', icon: ImageIcon },
  { id: 'settings', label: 'Configurações', icon: Settings },
] as const satisfies ReadonlyArray<{
  id: PanelSection
  label: string
  icon: typeof CalendarDays
}>

/** Contador de pedidos pendentes, ao lado de "Pedidos". */
export const PENDING_BADGE =
  'type-caption tabular rounded-(--radius-full) bg-(--status-pending-bg) px-(--space-8) py-(--space-2) text-(--status-pending-fg)'
