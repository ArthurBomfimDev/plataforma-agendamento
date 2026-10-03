import type { ReactNode } from 'react'

export type TabBarItem = {
  id: string
  label: string
  /** Conteúdo do painel da aba. */
  content: ReactNode
}

export type TabBarProps = {
  /** Nome acessível do conjunto de abas. */
  label: string
  items: TabBarItem[]
  /** Aba aberta no início. Padrão: a primeira. */
  defaultId?: string
  /** Classes da lista de abas, por exemplo o layout do desktop. */
  listClassName?: string
  /** Classes do painel de cada aba, por exemplo o espaçamento interno. */
  panelClassName?: string
  className?: string
}
