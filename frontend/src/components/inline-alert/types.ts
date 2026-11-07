import type { ReactNode } from 'react'

export type InlineAlertProps = {
  /** Padrão: `error`. */
  tone?: 'error' | 'success'
  /** O que houve e o que fazer. */
  children: ReactNode
  className?: string
}
