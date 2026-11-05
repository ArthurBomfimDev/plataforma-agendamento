import type { ReactNode } from 'react'

export type PanelPageProps = {
  title: string
  subtitle?: string
  /** Ação principal da tela ("Novo serviço"), ao lado do título. */
  actions?: ReactNode
  children: ReactNode
  /** Ocupa a largura toda da área de conteúdo, como o cadastro de serviço, em vez de uma coluna estreita. */
  wide?: boolean
}
