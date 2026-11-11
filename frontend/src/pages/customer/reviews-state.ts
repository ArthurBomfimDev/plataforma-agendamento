import type { ReviewsListState, ReviewsSectionProps } from '@components/reviews-section'
import {
  useBusinessRating,
  useBusinessReviews,
  useProfessionalRating,
  useProfessionalReviews,
} from '@api/services/review/hooks'

import type { RatingSummaryResponse } from '@api/models'
import { errorMessage } from '@api/base'
import { useState } from 'react'

export type ReviewsState = Pick<ReviewsSectionProps, 'summary' | 'list'> & {
  /** A nota já lida, para o cabeçalho ("★ 4,8 (12)" ou "Novo"). Nula enquanto carrega ou se deu erro. */
  rating: RatingSummaryResponse | null
}

const totalPagesOf = (totalCount: number, pageSize: number) =>
  Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)))

const build = (
  rating: ReturnType<typeof useBusinessRating>,
  reviews: ReturnType<typeof useBusinessReviews>,
  page: number,
  setPage: (page: number) => void,
): ReviewsState => {
  const list: ReviewsListState = reviews.isError
    ? {
        status: 'error',
        message: errorMessage(reviews.error),
        onRetry: () => void reviews.refetch(),
      }
    : reviews.data
      ? {
          status: 'ready',
          items: reviews.data.items,
          page: reviews.data.page,
          totalPages: totalPagesOf(reviews.data.totalCount, reviews.data.pageSize),
          onPageChange: setPage,
        }
      : { status: 'loading' }

  return {
    rating: rating.data ?? null,
    summary: rating.isError
      ? { status: 'error' }
      : rating.data
        ? { status: 'ready', data: rating.data }
        : { status: 'loading' },
    list: list.status === 'ready' && list.page !== page ? { status: 'loading' } : list,
  }
}

/** Nota e lista paginada de um estabelecimento, no formato que a seção de avaliações desenha. */
export const useBusinessReviewsState = (businessId: string): ReviewsState => {
  const [page, setPage] = useState(1)
  return build(useBusinessRating(businessId), useBusinessReviews(businessId, page), page, setPage)
}

/** O mesmo para um profissional. */
export const useProfessionalReviewsState = (professionalId: string): ReviewsState => {
  const [page, setPage] = useState(1)
  return build(
    useProfessionalRating(professionalId),
    useProfessionalReviews(professionalId, page),
    page,
    setPage,
  )
}
