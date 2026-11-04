import type { PanelSection } from '@components/panel-sidebar/types'

export type PanelMoreScreenProps = {
  businessName: string
  /** Seções que este papel não opera. */
  hiddenSections: ReadonlyArray<PanelSection>
  onNavigate: (section: PanelSection) => void
  /** A conta: troca de contexto e sair (tela `#/context`, da Onda 7A). */
  onAccount: () => void
}
