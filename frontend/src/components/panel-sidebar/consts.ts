import { ArrowUpRight, Ban, Calendar, Clock, Lock, Plus, Star, User } from 'lucide-react'

import type { PanelSection } from './types'

/** Ordem e ícones da tela 09 do Figma. */
export const SECTIONS = [
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'requests', label: 'Pedidos', icon: Clock },
  { id: 'services', label: 'Serviços', icon: Plus },
  { id: 'professionals', label: 'Profissionais', icon: User },
  { id: 'schedules', label: 'Jornadas e bloqueios', icon: Lock },
  { id: 'reviews', label: 'Avaliações', icon: Star },
  { id: 'reports', label: 'Relatórios', icon: ArrowUpRight },
  // TODO(figma): o wireframe usa o ícone de "proibido" para Configurações; parece provisório.
  { id: 'settings', label: 'Configurações', icon: Ban },
] as const satisfies ReadonlyArray<{ id: PanelSection; label: string; icon: typeof Calendar }>

/** Contador de pedidos pendentes, ao lado de "Pedidos". */
export const PENDING_BADGE =
  'type-caption tabular rounded-(--radius-full) bg-(--status-pending-bg) px-(--space-8) py-(--space-2) text-(--status-pending-fg)'
