import type { IconComponent } from '@assets/icons'
import type { PanelSection } from '@components/panel-sidebar/types'
import type { ReactNode } from 'react'

/** Abas do consumidor. */
export type NavigationItemId = 'search' | 'appointments' | 'profile'

/**
 * Abas do painel no celular (P01): as duas seções do dia a dia; o resto fica em "Mais". Relatórios saiu (Onda 7D):
 * não há backend para ele.
 */
export type PanelBottomItem = Extract<PanelSection, 'agenda' | 'requests'> | 'more'

export type BottomNavigationItem<TItem extends string> = {
  id: TItem
  label: string
  icon: IconComponent
}

/** `app`: a do consumidor (Figma 03/08). `panel`: a do painel (P01), mais justa e com espaço para a ação. */
export type BottomNavigationVariant = 'app' | 'panel'

export type BottomNavigationProps<TItem extends string> = {
  items: ReadonlyArray<BottomNavigationItem<TItem>>
  activeItem: TItem
  onNavigate?: (item: TItem) => void
  /** Nome da navegação para leitor de tela. */
  label: string
  variant?: BottomNavigationVariant
  /** Contador ao lado do ícone, por aba (ex.: pedidos pendentes). */
  badges?: Partial<Record<TItem, ReactNode>>
  /** Ação principal da tela, acima das abas (ex.: "+ Marcação de balcão"). */
  action?: ReactNode
}
