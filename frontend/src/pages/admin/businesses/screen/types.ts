import type {
  AdminBusinessDetailResponse,
  BusinessReportResponse,
  BusinessResponse,
} from '@api/models'

/** Estado de uma lista ou de um detalhe: carregando, erro com "Tentar de novo", ou pronto. */
export type Load<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; data: T }

export type AdminTab = 'businesses' | 'reports'

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
}
