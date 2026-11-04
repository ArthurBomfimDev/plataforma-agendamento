import type {
  MyReviewResponse,
  PagedResult,
  PublicReviewResponse,
  RatingSummaryResponse,
  SaveReviewRequest,
} from '@api/models'
import { authRequest, request } from '@api/base'

import { reviewEndpoints } from './endpoints'

/** Quantas avaliações por página na vitrine. */
export const REVIEWS_PAGE_SIZE = 10

export const reviewService = {
  create: (appointmentId: string, data: SaveReviewRequest) =>
    authRequest<MyReviewResponse>({
      method: 'POST',
      url: reviewEndpoints.ofAppointment(appointmentId),
      data,
    }),
  /** Uma única edição, em até 7 dias. */
  update: (appointmentId: string, data: SaveReviewRequest) =>
    authRequest<MyReviewResponse>({
      method: 'PUT',
      url: reviewEndpoints.ofAppointment(appointmentId),
      data,
    }),
  mine: (signal?: AbortSignal) =>
    authRequest<PagedResult<MyReviewResponse>>({
      url: reviewEndpoints.mine,
      params: { pageSize: 100 },
      signal,
    }),
  businessReviews: (businessId: string, page: number, signal?: AbortSignal) =>
    request<PagedResult<PublicReviewResponse>>({
      url: reviewEndpoints.businessReviews(businessId),
      params: { page, pageSize: REVIEWS_PAGE_SIZE },
      signal,
    }),
  businessRating: (businessId: string, signal?: AbortSignal) =>
    request<RatingSummaryResponse>({ url: reviewEndpoints.businessRating(businessId), signal }),
  professionalReviews: (professionalId: string, page: number, signal?: AbortSignal) =>
    request<PagedResult<PublicReviewResponse>>({
      url: reviewEndpoints.professionalReviews(professionalId),
      params: { page, pageSize: REVIEWS_PAGE_SIZE },
      signal,
    }),
  professionalRating: (professionalId: string, signal?: AbortSignal) =>
    request<RatingSummaryResponse>({
      url: reviewEndpoints.professionalRating(professionalId),
      signal,
    }),
}
