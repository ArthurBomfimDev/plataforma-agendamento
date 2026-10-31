import {
  CalendarMonthIcon,
  EventUpcomingIcon,
  GroupIcon,
  ImageIcon,
  InboxIcon,
  SellIcon,
  SettingsIcon,
} from '@assets/icons'

import type { PanelSection } from './types'

/**
 * Ordem da tela 09 do Figma, sem Avaliações e Relatórios: não há backend para eles (fora do recorte,
 * `PROJECT-CONTEXT.md` §12), e item que não leva a lugar nenhum não fica no menu (Onda 7D). Ícones
 * do mesmo conjunto do app (Material Symbols, `@assets/icons`), escolhidos pelo que a seção faz.
 */
export const SECTIONS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarMonthIcon },
  { id: 'requests', label: 'Pedidos', icon: InboxIcon },
  { id: 'services', label: 'Serviços', icon: SellIcon },
  { id: 'professionals', label: 'Profissionais', icon: GroupIcon },
  { id: 'schedules', label: 'Jornadas e bloqueios', icon: EventUpcomingIcon },
  { id: 'photos', label: 'Fotos', icon: ImageIcon },
  { id: 'settings', label: 'Configurações', icon: SettingsIcon },
] as const satisfies ReadonlyArray<{
  id: PanelSection
  label: string
  icon: typeof CalendarMonthIcon
}>
