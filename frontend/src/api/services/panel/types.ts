import type { ImageSet } from '@api/models'

export type PanelAction = 'confirm' | 'reject' | 'cancel' | 'complete' | 'noShow'

export type PanelActionVariables = { action: PanelAction; appointmentId: string }

/** O que o painel precisa do estabelecimento, venha do detalhe do dono ou da vitrine. */
export type PanelBusiness = {
  name: string
  category: string
  logo: ImageSet | null
  timeZone: string
  pendingExpirationHours: number
  autoConfirm: boolean
}
