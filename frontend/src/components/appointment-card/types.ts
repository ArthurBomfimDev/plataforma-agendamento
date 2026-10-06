import type { AppointmentStatus } from '../status-chip/types'
import type { ReactNode } from 'react'

export type AppointmentCardProps = {
  businessName: string
  status: AppointmentStatus
  /** Celular: uma linha de resumo — "Corte masculino · sex, 11 set · 09:30". */
  summary: string
  /** Desktop: serviço e duração — "Corte masculino · 30 min". */
  serviceLine: string
  /** Desktop: quando, com a faixa de horário — "sex, 11 set · 09:30 — 10:00". */
  whenLine: string
  /** Linha de contexto do estado: prazo de confirmação, endereço etc. */
  detail?: ReactNode
  /** Botões de ação do card. No desktop ficam à direita. */
  actions?: ReactNode
  /** Desktop: borda de 2px no tom "urgente", para o pedido que ainda espera resposta (08D). */
  highlight?: boolean
  imageUrl?: string
  className?: string
}
