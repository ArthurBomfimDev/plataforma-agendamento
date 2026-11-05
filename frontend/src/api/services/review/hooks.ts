import { useService, useServiceMutation } from '@api/base'

import type { SaveReviewRequest } from '@api/models'
import { queryKeys } from '../query-keys'
import { reviewService } from '.'
import { useSessionStore } from '@store/session'

/** Nota e lista públicas do estabelecimento. Sem nova tentativa em 404: estabelecimento fora da vitrine não volta sozinho. */
export const useBusinessRating = (businessId: string) =>
  useService({
    queryKey: queryKeys.businessRating(businessId),
    service: (signal) => reviewService.businessRating(businessId, signal),
    retry: false,
  })

export const useBusinessReviews = (businessId: string, page: number) =>
  useService({
    queryKey: queryKeys.businessReviews(businessId, page),
    service: (signal) => reviewService.businessReviews(businessId, page, signal),
    retry: false,
  })

export const useProfessionalRating = (professionalId: string) =>
  useService({
    queryKey: queryKeys.professionalRating(professionalId),
    service: (signal) => reviewService.professionalRating(professionalId, signal),
    retry: false,
  })

export const useProfessionalReviews = (professionalId: string, page: number) =>
  useService({
    queryKey: queryKeys.professionalReviews(professionalId, page),
    service: (signal) => reviewService.professionalReviews(professionalId, page, signal),
    retry: false,
  })

/** As avaliações que o consumidor fez, para "Meus agendamentos" saber o que já foi avaliado. */
export const useMyReviews = () =>
  useService({
    queryKey: queryKeys.myReviews,
    service: async (signal) => (await reviewService.mine(signal)).items,
    enabled: useSessionStore((state) => state.session !== null),
  })

/** Fila de moderação do Admin: denúncias abertas ou avaliações ocultas. */
export const useAdminReviews = (status: 'Open' | 'Hidden') =>
  useService({
    queryKey: queryKeys.adminReviews(status),
    service: async (signal) => (await reviewService.admin.list(status, signal)).items,
  })

/** Ocultar e reexibir mexem na lista pública e na média; as três decisões mexem na fila. */
export const useModerateReview = () =>
  useServiceMutation({
    service: ({
      reviewId,
      action,
      reason,
    }: {
      reviewId: string
      action: 'hide' | 'unhide' | 'dismiss'
      reason?: string
    }) =>
      action === 'hide'
        ? reviewService.admin.hide(reviewId, reason ?? '')
        : action === 'unhide'
          ? reviewService.admin.unhide(reviewId)
          : reviewService.admin.dismiss(reviewId),
    invalidates: [queryKeys.admin, queryKeys.reviews, queryKeys.searches],
  })

/** Avaliar (POST) ou editar (PUT) muda a lista pública, a nota e a média mostrada na busca. */
export const useSaveReview = () =>
  useServiceMutation({
    service: ({
      appointmentId,
      request,
      edit,
    }: {
      appointmentId: string
      request: SaveReviewRequest
      edit: boolean
    }) =>
      edit
        ? reviewService.update(appointmentId, request)
        : reviewService.create(appointmentId, request),
    invalidates: [queryKeys.reviews, queryKeys.myReviews, queryKeys.searches],
  })
