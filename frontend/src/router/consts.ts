export const ROUTES = {
  home: '/',
  business: '/businesses/:businessId',
  chooseProfessional: '/businesses/:businessId/services/:serviceId/professionals',
} as const

export const businessPath = (businessId: string) => `/businesses/${encodeURIComponent(businessId)}`

export const chooseProfessionalPath = (businessId: string, serviceId: string) =>
  `${businessPath(businessId)}/services/${encodeURIComponent(serviceId)}/professionals`
