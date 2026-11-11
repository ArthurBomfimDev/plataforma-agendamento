import type { BusinessCategoryName, BusinessStatusName, ChecklistItemResponse } from '@api/models'

/** O estado que a faixa mostra. "Reprovado" é rascunho com nível de verificação `Rejected`. */
export type BannerState = 'draft' | 'review' | 'rejected' | 'suspended' | 'active'

export type BannerBusiness = {
  status: BusinessStatusName
  verificationLevel: string
  category: BusinessCategoryName
  /** Motivo da suspensão ou da reprovação. */
  reason: string | null
}

export type BusinessStatusBannerProps = {
  business: BannerBusiness
  /** `undefined` enquanto carrega. */
  checklist?: ChecklistItemResponse[]
  checklistError?: string
  onRetryChecklist?: () => void
  busy: boolean
  /** Erro da última tentativa de publicar ou enviar, em português. */
  error?: string
  /** Mostra "Aprovado" uma vez, no primeiro acesso depois da aprovação. */
  showApproved: boolean
  onDismissApproved: () => void
  onPublish: () => void
  onSubmit: () => void
  /** Leva ao lugar de resolver um item (cadastro ou tela do painel). */
  onFix: (key: string) => void
  /**
   * Passo guiado: o dono está numa página do painel resolvendo este item. A faixa troca o texto, mostra
   * "Voltar à lista" e "Próximo pendente" e não repete a ação da página. Só vale no rascunho e enquanto o
   * item continua pendente.
   */
  guide?: { key: string; onExit: () => void }
}
