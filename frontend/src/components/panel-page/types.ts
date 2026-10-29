import type { ReactNode } from 'react'

export type PanelPageProps = {
  title: string
  subtitle?: string
  /** Ação principal da tela ("Novo serviço"), ao lado do título. */
  actions?: ReactNode
  children: ReactNode
}
