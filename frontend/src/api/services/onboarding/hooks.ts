import { useService, useServiceMutation } from '@api/base'

import type { AdminDecision } from '.'
import { onboardingService } from '.'
import { queryKeys } from '../query-keys'

/** A visão completa do dono (status, motivo, termos). Só para quem está no contexto de dono. */
export const useOwnerBusiness = (businessId: string, enabled = true) =>
  useService({
    queryKey: queryKeys.ownerBusiness(businessId),
    service: (signal) => onboardingService.current(signal),
    enabled,
  })

export const useOwnerChecklist = (businessId: string, enabled = true) =>
  useService({
    queryKey: queryKeys.ownerChecklist(businessId),
    service: (signal) => onboardingService.checklist(signal),
    enabled,
  })

/** Criar o estabelecimento. Quem chama troca o contexto para ele depois (`useSwitchContext`). */
export const useRegisterBusiness = () =>
  useServiceMutation({ service: onboardingService.register, invalidates: [queryKeys.me] })

/** Escritas do dono sobre o estabelecimento atual: todas recarregam a visão dele e a checklist. */
const ownerWrite = <TVariables, TData>(service: (variables: TVariables) => Promise<TData>) => ({
  service,
  invalidates: [queryKeys.allPanels],
  invalidateOn: 'settled' as const,
})

export const useUpdateAddress = () =>
  useServiceMutation(ownerWrite(onboardingService.updateAddress))
export const useConfirmLocation = () =>
  useServiceMutation(ownerWrite(onboardingService.confirmLocation))
export const useSetResponsible = () =>
  useServiceMutation(ownerWrite(onboardingService.setResponsible))
export const useAcceptTerms = () => useServiceMutation(ownerWrite(onboardingService.acceptTerms))
export const useSubmitBusiness = () =>
  useServiceMutation(ownerWrite(() => onboardingService.submit()))
export const usePublishBusiness = () =>
  useServiceMutation(ownerWrite(() => onboardingService.publish()))

export const useReportBusiness = () =>
  useServiceMutation({
    service: ({ businessId, reason }: { businessId: string; reason: string }) =>
      onboardingService.report(businessId, reason),
  })

// --- Admin da plataforma ---

export const useAdminBusinesses = (status: string, category: string | null) =>
  useService({
    queryKey: queryKeys.adminBusinesses(status, category),
    service: (signal) => onboardingService.admin.list({ status, category }, signal),
  })

export const useAdminBusiness = (businessId: string | null) =>
  useService({
    queryKey: queryKeys.adminBusiness(businessId ?? ''),
    service: (signal) => onboardingService.admin.detail(businessId!, signal),
    enabled: businessId !== null,
  })

export const useAdminReports = (status: 'Open' | 'Resolved') =>
  useService({
    queryKey: queryKeys.adminReports(status),
    service: (signal) => onboardingService.admin.reports(status, signal),
  })

export const useAdminDecision = () =>
  useServiceMutation({
    service: ({
      businessId,
      action,
      note,
    }: {
      businessId: string
      action: AdminDecision
      note: string | null
    }) => onboardingService.admin.decide(businessId, action, note),
    invalidates: [queryKeys.admin],
    invalidateOn: 'settled',
  })

export const useResolveReport = () =>
  useServiceMutation({
    service: ({ reportId, note }: { reportId: string; note: string | null }) =>
      onboardingService.admin.resolveReport(reportId, note),
    invalidates: [queryKeys.admin],
  })
