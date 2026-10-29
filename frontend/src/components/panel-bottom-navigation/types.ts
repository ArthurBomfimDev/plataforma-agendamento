import type { PanelSection } from '@components/panel-sidebar/types'
import type { ReactNode } from 'react'

/** Abas do celular (P01): as quatro seções mais usadas; o resto fica em "Mais". */
export type PanelBottomItem = Extract<PanelSection, 'agenda' | 'requests' | 'reports'> | 'more'

export type PanelBottomNavigationProps = {
  activeItem: PanelBottomItem
  /** Pedidos aguardando resposta. Zero esconde o contador. */
  pendingRequests: number
  onNavigate?: (item: PanelBottomItem) => void
  /** Ação principal da tela, acima das abas (ex.: "+ Marcação de balcão"). */
  action?: ReactNode
}
