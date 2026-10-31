import type {
  GeoPlaceResponse,
  PagedResult,
  PostalCodeResponse,
  ReverseGeocodeResponse,
} from '@api/models'

import { geoEndpoints } from './endpoints'
import { request } from '@api/base'
import { roundCoordinate } from '@store/location'

/**
 * Localização. O ponto do aparelho vai arredondado (3 casas) já daqui: a API arredonda de novo antes de falar
 * com o provedor, mas o dado exato não precisa sair do aparelho.
 */
export const geoService = {
  postalCode: (postalCode: string) =>
    request<PostalCodeResponse>({ url: geoEndpoints.postalCode(postalCode) }),
  search: (text: string) =>
    request<PagedResult<GeoPlaceResponse>>({ url: geoEndpoints.search, params: { q: text } }),
  reverse: (latitude: number, longitude: number) =>
    request<ReverseGeocodeResponse>({
      url: geoEndpoints.reverse,
      params: { lat: roundCoordinate(latitude), lng: roundCoordinate(longitude) },
    }),
}
