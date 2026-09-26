export const ROUTES = {
  home: '/',
  business: '/businesses/:businessId',
} as const

export const businessPath = (businessId: string) => `/businesses/${encodeURIComponent(businessId)}`
