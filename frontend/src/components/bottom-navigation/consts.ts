import type {
  BottomNavigationItem,
  BottomNavigationVariant,
  NavigationItemId,
  PanelBottomItem,
} from './types'
import {
  CalendarMonthIcon,
  CalendarTodayIcon,
  InboxIcon,
  MenuIcon,
  PersonIcon,
  SearchIcon,
} from '@assets/icons'

export const APP_NAVIGATION_ITEMS: ReadonlyArray<BottomNavigationItem<NavigationItemId>> = [
  { id: 'search', label: 'Buscar', icon: SearchIcon },
  { id: 'appointments', label: 'Agendamentos', icon: CalendarTodayIcon },
  { id: 'profile', label: 'Perfil', icon: PersonIcon },
]

/** Os mesmos ícones da lateral (`panel-sidebar/consts.ts`); "Mais" abre as outras seções e a conta. */
export const PANEL_NAVIGATION_ITEMS: ReadonlyArray<BottomNavigationItem<PanelBottomItem>> = [
  { id: 'agenda', label: 'Agenda', icon: CalendarMonthIcon },
  { id: 'requests', label: 'Pedidos', icon: InboxIcon },
  { id: 'more', label: 'Mais', icon: MenuIcon },
]

/** As medidas de cada frame do Figma. O resto da barra é igual nas duas. */
export const VARIANT_CLASSES: Record<
  BottomNavigationVariant,
  { bar: string; list: string; button: string }
> = {
  app: {
    bar: 'pt-(--space-8) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))]',
    list: 'gap-(--space-8)',
    button: 'gap-(--space-4)',
  },
  panel: {
    bar: 'pt-(--space-12) pb-[calc(var(--space-8)+env(safe-area-inset-bottom))]',
    list: 'gap-(--space-2)',
    button: 'gap-(--space-2) px-(--space-4) pt-(--space-8) pb-(--space-4)',
  },
}

// Altura da navegação inferior (8 + 44 + 16) mais a safe-area, para o conteúdo não ficar por baixo.
// No desktop a navegação inferior some (vira a barra superior) e sobra só o respiro do Figma.
export const CONTENT_BOTTOM_PADDING =
  'pb-[calc(var(--space-16)+var(--space-8)+var(--size-touch-min)+var(--space-16)+env(safe-area-inset-bottom))] lg:pb-(--space-40)'

// Painel: abas (8 + 44 + 8) mais a safe-area; com ação, soma o botão grande (16 + 24 + 16) e o espaço entre eles.
export const PANEL_CONTENT_BOTTOM_PADDING =
  'pb-[calc(var(--space-12)+var(--space-8)+var(--size-touch-min)+var(--space-8)+env(safe-area-inset-bottom))] lg:pb-(--space-24)'

export const PANEL_CONTENT_BOTTOM_PADDING_WITH_ACTION =
  'pb-[calc(var(--space-12)+var(--space-16)+var(--line-height-body)+var(--space-16)+var(--space-8)+var(--space-8)+var(--size-touch-min)+var(--space-8)+var(--space-16)+env(safe-area-inset-bottom))] lg:pb-(--space-24)'
