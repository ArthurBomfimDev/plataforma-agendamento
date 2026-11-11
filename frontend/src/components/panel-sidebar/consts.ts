import {
  BadgeIcon,
  BlockIcon,
  PersonIcon,
  CalendarMonthIcon,
  EventUpcomingIcon,
  GroupIcon,
  ImageIcon,
  InboxIcon,
  SellIcon,
  SettingsIcon,
  StarIcon,
} from '@assets/icons'

import type { PanelSection } from './types'

/**
 * Ordem da tela 09 do Figma, sem Relatórios: não há backend para eles (fora do recorte,
 * `PROJECT-CONTEXT.md` §12), e item que não leva a lugar nenhum não fica no menu (Onda 7D). Ícones
 * do mesmo conjunto do app (Material Symbols, `@assets/icons`), escolhidos pelo que a seção faz.
 */
export const SECTIONS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarMonthIcon },
  { id: 'requests', label: 'Pedidos', icon: InboxIcon },
  { id: 'services', label: 'Serviços', icon: SellIcon },
  { id: 'professionals', label: 'Profissionais', icon: GroupIcon },
  { id: 'members', label: 'Equipe', icon: BadgeIcon },
  { id: 'schedules', label: 'Jornadas e bloqueios', icon: EventUpcomingIcon },
  { id: 'photos', label: 'Fotos', icon: ImageIcon },
  { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  { id: 'reviews', label: 'Avaliações', icon: StarIcon },
  // Só atendente e profissional (o dono tem "Jornadas e bloqueios"). O "Meu perfil" do atendente é só a conta.
  { id: 'blocks', label: 'Folgas e bloqueios', icon: BlockIcon },
  { id: 'profile', label: 'Meu perfil', icon: PersonIcon },
] as const satisfies ReadonlyArray<{
  id: PanelSection
  label: string
  icon: typeof CalendarMonthIcon
}>
