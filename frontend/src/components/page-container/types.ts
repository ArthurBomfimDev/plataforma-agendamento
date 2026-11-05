import type { ReactNode } from 'react'
import type { WIDTHS } from './consts'

export type PageContainerProps = {
  width?: keyof typeof WIDTHS
  className?: string
  children: ReactNode
}
