import { ArrowUpRight, Calendar, Clock, User } from 'lucide-react'

import type { PanelBottomItem } from './types'

export const ITEMS = [
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'requests', label: 'Pedidos', icon: Clock },
  { id: 'reports', label: 'Relatórios', icon: ArrowUpRight },
  { id: 'more', label: 'Mais', icon: User },
] as const satisfies ReadonlyArray<{ id: PanelBottomItem; label: string; icon: typeof Calendar }>

// Abas (8 + 44 + 8) mais a safe-area; com ação, soma o botão grande (16 + 24 + 16) e o espaço entre eles.
// No desktop a navegação inferior some e sobra só o respiro do Figma.
export const PANEL_CONTENT_BOTTOM_PADDING =
  'pb-[calc(var(--space-12)+var(--space-8)+var(--size-touch-min)+var(--space-8)+env(safe-area-inset-bottom))] lg:pb-(--space-24)'

export const PANEL_CONTENT_BOTTOM_PADDING_WITH_ACTION =
  'pb-[calc(var(--space-12)+var(--space-16)+var(--line-height-body)+var(--space-16)+var(--space-8)+var(--space-8)+var(--size-touch-min)+var(--space-8)+var(--space-16)+env(safe-area-inset-bottom))] lg:pb-(--space-24)'
