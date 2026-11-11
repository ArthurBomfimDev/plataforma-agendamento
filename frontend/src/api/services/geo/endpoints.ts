export const geoEndpoints = {
  postalCode: (postalCode: string) => `/api/geo/postal-code/${encodeURIComponent(postalCode)}`,
  search: '/api/geo/search',
  reverse: '/api/geo/reverse',
}
