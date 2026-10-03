import type { ReactNode } from 'react'

export type ProfessionalOptionProps = {
  /** Avatar do profissional ou marcador da opção "Sem preferência". */
  leading: ReactNode
  title: string
  /** Linhas secundárias, em texto de legenda. */
  details: string[]
  onSelect?: () => void
  className?: string
}
