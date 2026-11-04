import type { ReactNode } from 'react'

/** As peças de controle da agenda, montadas pela rota (que tem a URL e o período). */
export type AgendaControls = {
  viewSwitch: ReactNode
  navigator: ReactNode
  filters: ReactNode
}

export type AgendaHeaderProps = {
  title: string
  /** "sexta, 11 de setembro de 2026 · Estúdio Duartina". */
  caption: string
  controls?: AgendaControls
  /** "+ Marcação de balcão". No celular, o botão fica sobre a navegação inferior (`PanelLayout`). */
  onCounterBooking?: () => void
}
