import type {
  BusinessSearchItemResponse,
  PagedResult,
  PublicBusinessResponse,
  PublicProfessionalResponse,
  PublicServiceResponse,
} from '@api/models'

import type { SearchBusinessesParams } from './types'
import { businessEndpoints } from './endpoints'
import { request } from '@api/base'

/** Vitrine pública: nenhuma chamada daqui leva token. */
export const businessService = {
  search: (params: SearchBusinessesParams, signal?: AbortSignal) =>
    request<PagedResult<BusinessSearchItemResponse>>({
      url: businessEndpoints.search,
      params,
      signal,
    }),
  get: (businessId: string, signal?: AbortSignal) =>
    request<PublicBusinessResponse>({ url: businessEndpoints.business(businessId), signal }),
  services: (businessId: string, signal?: AbortSignal) =>
    request<PagedResult<PublicServiceResponse>>({
      url: businessEndpoints.services(businessId),
      params: { pageSize: 50 },
      signal,
    }),
  professionals: (businessId: string, signal?: AbortSignal) =>
    request<PagedResult<PublicProfessionalResponse>>({
      url: businessEndpoints.professionals(businessId),
      params: { pageSize: 50 },
      signal,
    }),
}
