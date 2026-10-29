import type { PanelSection } from '@components/panel-sidebar/types'
import type { ReactNode } from 'react'

/**
 * Abas do celular (P01): as duas seções do dia a dia; o resto fica em "Mais". Relatórios saiu (Onda 7D):
 * não há backend para ele.
 */
export type PanelBottomItem = Extract<PanelSection, 'agenda' | 'requests'> | 'more'

export type PanelBottomNavigationProps = {
  activeItem: PanelBottomItem
  /** Pedidos aguardando resposta. Zero esconde o contador. */
  pendingRequests: number
  onNavigate?: (item: PanelBottomItem) => void
  /** Ação principal da tela, acima das abas (ex.: "+ Marcação de balcão"). */
  action?: ReactNode
}
