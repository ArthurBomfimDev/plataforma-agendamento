const business = (businessId: string) => `/api/businesses/${encodeURIComponent(businessId)}`

export const businessEndpoints = {
  search: '/api/businesses/search',
  business,
  services: (businessId: string) => `${business(businessId)}/services`,
  professionals: (businessId: string) => `${business(businessId)}/professionals`,
}
