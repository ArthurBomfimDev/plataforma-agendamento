import { PANEL_PATH } from '../panel/endpoints'

const enc = encodeURIComponent
const admin = '/api/admin/businesses'

/** Cadastro do estabelecimento (ondas finais). As rotas `current/*` são do contexto de dono; `admin/*`, da plataforma. */
export const onboardingEndpoints = {
  register: '/api/businesses',
  current: PANEL_PATH,
  checklist: `${PANEL_PATH}/checklist`,
  address: `${PANEL_PATH}/address`,
  location: `${PANEL_PATH}/location`,
  responsible: `${PANEL_PATH}/responsible`,
  terms: `${PANEL_PATH}/terms`,
  submit: `${PANEL_PATH}/submit`,
  publish: `${PANEL_PATH}/publish`,
  report: (businessId: string) => `/api/businesses/${enc(businessId)}/reports`,
  admin: {
    list: admin,
    detail: (businessId: string) => `${admin}/${enc(businessId)}`,
    decision: (businessId: string, action: 'approve' | 'reject' | 'suspend' | 'reinstate') =>
      `${admin}/${enc(businessId)}/${action}`,
    reports: `${admin}/reports`,
    resolveReport: (reportId: string) => `${admin}/reports/${enc(reportId)}/resolve`,
  },
}
