import type { ReactNode } from 'react'

export type AuthLayoutProps = {
  title: string
  /** Linha de apoio abaixo do título. */
  description?: string
  /** Nota legal no pé do painel. */
  footnote?: string
  children: ReactNode
}
