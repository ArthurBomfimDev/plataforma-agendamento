import type {
  AdminBusinessDetailResponse,
  BusinessReportResponse,
  BusinessResponse,
  ModerationReviewResponse,
  ProfessionalRemovalResponse,
} from '@api/models'

/** Estado de uma lista ou de um detalhe: carregando, erro com "Tentar de novo", ou pronto. */
export type Load<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; data: T }

export type AdminTab = 'businesses' | 'reports' | 'removals' | 'reviews'

export type AdminFilters = { status: string; category: string }

/** Cada decisão devolve `null` se deu certo, senão a mensagem de erro já em português. */
export type DecisionResult = Promise<string | null>

export type AdminBusinessesScreenProps = {
  tab: AdminTab
  onTabChange: (tab: AdminTab) => void

  filters: AdminFilters
  onFiltersChange: (filters: AdminFilters) => void
  businesses: Load<BusinessResponse[]>
  selectedId: string | null
  onSelect: (businessId: string | null) => void
  detail: Load<AdminBusinessDetailResponse>
  /** `note` é o motivo; obrigatório para reprovar e suspender (a tela exige antes de chamar). */
  onDecide: (
    action: 'approve' | 'reject' | 'suspend' | 'reinstate',
    note: string | null,
  ) => DecisionResult

  reportStatus: 'Open' | 'Resolved'
  onReportStatusChange: (status: 'Open' | 'Resolved') => void
  reports: Load<BusinessReportResponse[]>
  onResolveReport: (reportId: string, note: string | null) => DecisionResult

  /** Pedidos de remoção de perfil (ADR-031): fila própria, na aba "Remoções de perfil". */
  removalStatus?: 'Open' | 'Resolved'
  onRemovalStatusChange?: (status: 'Open' | 'Resolved') => void
  removals?: Load<ProfessionalRemovalResponse[]>
  onResolveRemoval?: (requestId: string, note: string | null) => DecisionResult

  /** Moderação de avaliações (ADR-032): denúncias abertas e as ocultas, que podem ser reexibidas. */
  reviewStatus?: 'Open' | 'Hidden'
  onReviewStatusChange?: (status: 'Open' | 'Hidden') => void
  moderation?: Load<ModerationReviewResponse[]>
  onModerate?: (
    reviewId: string,
    action: 'hide' | 'unhide' | 'dismiss',
    reason?: string,
  ) => DecisionResult
}
