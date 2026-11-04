import type {
  AdminBusinessDetailResponse,
  AdminBusinessList,
  AdminReportList,
  BusinessReportResponse,
  BusinessResponse,
  ChecklistItemResponse,
  ConfirmLocationRequest,
  OwnerBusinessResponse,
  PagedResult,
  RegisterBusinessRequest,
  SetResponsibleRequest,
  UpdateAddressRequest,
} from '@api/models'
import { authRequest, request } from '@api/base'

import { onboardingEndpoints } from './endpoints'

export type AdminListParams = { status: string; category: string | null }
export type AdminDecision = 'approve' | 'reject' | 'suspend' | 'reinstate'

/**
 * Cadastro do estabelecimento (ondas finais, 04/11). Escrita só do dono; as rotas de Admin recusam outra conta (403).
 * Reprovar e suspender exigem o motivo (`note`).
 */
export const onboardingService = {
  register: (data: RegisterBusinessRequest) =>
    authRequest<BusinessResponse>({ method: 'POST', url: onboardingEndpoints.register, data }),
  current: (signal?: AbortSignal) =>
    authRequest<OwnerBusinessResponse>({ url: onboardingEndpoints.current, signal }),
  checklist: (signal?: AbortSignal) =>
    // O servidor devolve uma página só (ADR-010, decisão 4); a tela quer a lista.
    authRequest<PagedResult<ChecklistItemResponse>>({
      url: onboardingEndpoints.checklist,
      signal,
    }).then((page) => page.items),
  updateAddress: (data: UpdateAddressRequest) =>
    authRequest<OwnerBusinessResponse>({ method: 'PUT', url: onboardingEndpoints.address, data }),
  confirmLocation: (data: ConfirmLocationRequest) =>
    authRequest<OwnerBusinessResponse>({ method: 'PUT', url: onboardingEndpoints.location, data }),
  setResponsible: (data: SetResponsibleRequest) =>
    authRequest<OwnerBusinessResponse>({
      method: 'PUT',
      url: onboardingEndpoints.responsible,
      data,
    }),
  acceptTerms: (version: string) =>
    authRequest<OwnerBusinessResponse>({
      method: 'POST',
      url: onboardingEndpoints.terms,
      data: { version },
    }),
  submit: () =>
    authRequest<OwnerBusinessResponse>({ method: 'POST', url: onboardingEndpoints.submit }),
  publish: () =>
    authRequest<OwnerBusinessResponse>({ method: 'POST', url: onboardingEndpoints.publish }),

  /** "Denunciar" na página pública: anônima. 204. */
  report: (businessId: string, reason: string) =>
    request<void>({
      method: 'POST',
      url: onboardingEndpoints.report(businessId),
      data: { reason },
    }),

  admin: {
    list: ({ status, category }: AdminListParams, signal?: AbortSignal) =>
      authRequest<AdminBusinessList>({
        url: onboardingEndpoints.admin.list,
        params: { status, pageSize: 100, ...(category ? { category } : {}) },
        signal,
      }),
    detail: (businessId: string, signal?: AbortSignal) =>
      authRequest<AdminBusinessDetailResponse>({
        url: onboardingEndpoints.admin.detail(businessId),
        signal,
      }),
    decide: (businessId: string, action: AdminDecision, note: string | null) =>
      authRequest<AdminBusinessDetailResponse>({
        method: 'POST',
        url: onboardingEndpoints.admin.decision(businessId, action),
        data: { note },
      }),
    reports: (status: 'Open' | 'Resolved', signal?: AbortSignal) =>
      authRequest<AdminReportList>({
        url: onboardingEndpoints.admin.reports,
        params: { status, pageSize: 100 },
        signal,
      }),
    resolveReport: (reportId: string, note: string | null) =>
      authRequest<BusinessReportResponse>({
        method: 'POST',
        url: onboardingEndpoints.admin.resolveReport(reportId),
        data: { note },
      }),
  },
}
