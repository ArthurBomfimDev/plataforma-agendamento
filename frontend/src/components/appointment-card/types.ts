import type { AppointmentStatus } from '../status-chip/types'
import type { ReactNode } from 'react'

export type AppointmentCardProps = {
  businessName: string
  status: AppointmentStatus
  /** Linha de resumo, já formatada: "Corte masculino · sex, 11 set · 09:30". */
  summary: string
  /** Linha de contexto do estado: prazo de confirmação, endereço etc. */
  detail?: ReactNode
  /** Botões de ação do card. */
  actions?: ReactNode
  className?: string
}
