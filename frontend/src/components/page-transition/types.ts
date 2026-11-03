import type { ReactNode } from 'react'

export type PageTransitionProps = {
  /** Muda quando a tela muda; a tela nova entra com a animação. */
  transitionKey: string
  children: ReactNode
}
