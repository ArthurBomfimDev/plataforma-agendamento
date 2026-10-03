export const ROUTES = {
  home: '/',
  business: '/businesses/:businessId',
  chooseProfessional: '/businesses/:businessId/services/:serviceId/professionals',
  availability: '/businesses/:businessId/services/:serviceId/availability',
} as const

/** Parâmetro de busca da tela de horários. Ausente = "Sem preferência". */
export const PROFESSIONAL_SEARCH_PARAM = 'professional'

export const businessPath = (businessId: string) => `/businesses/${encodeURIComponent(businessId)}`

const servicePath = (businessId: string, serviceId: string) =>
  `${businessPath(businessId)}/services/${encodeURIComponent(serviceId)}`

export const chooseProfessionalPath = (businessId: string, serviceId: string) =>
  `${servicePath(businessId, serviceId)}/professionals`

export const availabilityPath = (
  businessId: string,
  serviceId: string,
  professionalId: string | null,
) => {
  const path = `${servicePath(businessId, serviceId)}/availability`
  return professionalId
    ? `${path}?${new URLSearchParams({ [PROFESSIONAL_SEARCH_PARAM]: professionalId })}`
    : path
}
