export type LocationPrecision = 'Rooftop' | 'Street' | 'Locality' | 'City'

/** `GET /api/geo/postal-code/{cep}`. Logradouro e bairro faltam no CEP geral de cidade pequena. */
export type PostalCodeResponse = {
  postalCode: string
  street: string | null
  district: string | null
  city: string
  state: string
}

/** Um resultado de `GET /api/geo/search?q=` (até 5). */
export type GeoPlaceResponse = {
  label: string
  latitude: number
  longitude: number
  precision: LocationPrecision
  /** Cidade e sigla da UF, quando o provedor informa (Onda 7C). */
  city?: string | null
  state?: string | null
}

/** `GET /api/geo/reverse?lat=&lng=`. Cidade e UF quando o provedor informa (Onda 7C). */
export type ReverseGeocodeResponse = { label: string; city?: string | null; state?: string | null }
