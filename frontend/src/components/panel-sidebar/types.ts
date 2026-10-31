import type { ImageSet } from '@lib/api/types'
import type { ReactNode } from 'react'

/** Seções do painel do estabelecimento. O celular mostra só parte delas; o resto fica em "Mais". */
export type PanelSection =
  'agenda' | 'requests' | 'services' | 'professionals' | 'schedules' | 'photos' | 'settings'

export type PanelSidebarProps = {
  businessName: string
  /** Logotipo do estabelecimento. Nulo: a ilustração da categoria. */
  logo?: ImageSet | null
  /** `Beleza` ou `Saude`, para a ilustração sem logotipo. */
  category?: string
  /** Nula: a tela aberta não é uma seção do menu (o "Mais" do celular). */
  activeSection: PanelSection | null
  /** Pedidos aguardando resposta. Zero esconde o contador. */
  pendingRequests: number
  onNavigate?: (section: PanelSection) => void
  /** Seções que este papel não opera (o profissional não vê catálogo nem equipe). */
  hiddenSections?: ReadonlyArray<PanelSection>
  /** Fim da barra: o menu da conta, com a troca de contexto. */
  footer?: ReactNode
}
