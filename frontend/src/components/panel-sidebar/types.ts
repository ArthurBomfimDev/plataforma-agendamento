/** Seções do painel do estabelecimento. O celular mostra só parte delas; o resto fica em "Mais". */
export type PanelSection =
  | 'agenda'
  | 'requests'
  | 'services'
  | 'professionals'
  | 'schedules'
  | 'reviews'
  | 'reports'
  | 'settings'

export type PanelSidebarProps = {
  businessName: string
  activeSection: PanelSection
  /** Pedidos aguardando resposta. Zero esconde o contador. */
  pendingRequests: number
  onNavigate?: (section: PanelSection) => void
}
