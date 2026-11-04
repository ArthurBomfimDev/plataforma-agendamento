import type { AdminFilters, AdminTab, Load } from './screen/types'
import {
  useAdminBusiness,
  useAdminBusinesses,
  useAdminDecision,
  useAdminReports,
  useResolveReport,
} from '@api/services/onboarding/hooks'
import {
  useAdminProfessionalRemovals,
  useResolveProfessionalRemoval,
} from '@api/services/professional/hooks'
import { useState } from 'react'

import { AdminBusinessesScreen } from './screen'
import { RequireAdmin } from '@router/guards/require-admin'
import { errorMessage } from '@api/base'

/** Resultado de uma consulta no formato `Load` da tela: carregando, erro com "tentar de novo", ou pronto. */
const toLoad = <TData, TSelected>(
  query: {
    isError: boolean
    error: Error | null
    data: TData | undefined
    refetch: () => Promise<unknown>
  },
  select: (data: TData) => TSelected,
): Load<TSelected> =>
  query.isError
    ? { status: 'error', message: errorMessage(query.error), onRetry: () => void query.refetch() }
    : query.data !== undefined
      ? { status: 'ready', data: select(query.data) }
      : { status: 'loading' }

const AdminBusinesses = () => {
  const [tab, setTab] = useState<AdminTab>('businesses')
  const [filters, setFilters] = useState<AdminFilters>({ status: 'PendingReview', category: '' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reportStatus, setReportStatus] = useState<'Open' | 'Resolved'>('Open')

  const businesses = useAdminBusinesses(filters.status, filters.category || null)
  const detail = useAdminBusiness(selectedId)
  const reports = useAdminReports(reportStatus)
  const [removalStatus, setRemovalStatus] = useState<'Open' | 'Resolved'>('Open')
  const removals = useAdminProfessionalRemovals(removalStatus)
  const resolveRemoval = useResolveProfessionalRemoval()
  const decision = useAdminDecision()
  const resolve = useResolveReport()

  const attempt = async (task: () => Promise<unknown>) => {
    try {
      await task()
      return null
    } catch (error) {
      return errorMessage(error)
    }
  }

  return (
    <AdminBusinessesScreen
      tab={tab}
      onTabChange={setTab}
      filters={filters}
      onFiltersChange={(next) => {
        setSelectedId(null)
        setFilters(next)
      }}
      businesses={toLoad(businesses, (page) => page.items)}
      selectedId={selectedId}
      onSelect={setSelectedId}
      detail={toLoad(detail, (data) => data)}
      onDecide={(action, note) =>
        attempt(() => decision.mutateAsync({ businessId: selectedId!, action, note }))
      }
      reportStatus={reportStatus}
      onReportStatusChange={setReportStatus}
      reports={toLoad(reports, (page) => page.items)}
      onResolveReport={(reportId, note) => attempt(() => resolve.mutateAsync({ reportId, note }))}
      removalStatus={removalStatus}
      onRemovalStatusChange={setRemovalStatus}
      removals={toLoad(removals, (items) => items)}
      onResolveRemoval={(requestId, note) =>
        attempt(() => resolveRemoval.mutateAsync({ requestId, note }))
      }
    />
  )
}

/**
 * `#/admin/estabelecimentos`. Guard na tela (papel lido do token) E no servidor: toda rota `api/admin/*` responde 403
 * a quem não é Admin (ADR-020).
 */
export const AdminBusinessesRoute = () => (
  <RequireAdmin>
    <AdminBusinesses />
  </RequireAdmin>
)
