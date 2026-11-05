import { OwnerReviewsScreen, type OwnerReviewsData } from './screen'
import { REVIEWS_PAGE_SIZE, reviewService } from '@api/services/review'
import { errorMessage, useService } from '@api/base'

import { queryKeys } from '@api/services/query-keys'
import { usePanelContext } from '@layouts/panel-layout/context'
import { usePanelMutation } from '@api/services/panel/hooks'
import { useState } from 'react'

/** Painel — Avaliações, só do dono: a rota já exige o papel, e o servidor recusa o resto com 403. */
export const PanelReviewsRoute = () => {
  const { context } = usePanelContext()
  const [page, setPage] = useState(1)

  const reviews = useService({
    queryKey: queryKeys.panelReviews(context.businessId, page),
    service: (signal) => reviewService.owner(page, signal),
  })
  const report = usePanelMutation(
    context.businessId,
    ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      reviewService.report(reviewId, reason),
  )

  const data: OwnerReviewsData = reviews.isError
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
          totalPages: Math.max(1, Math.ceil(reviews.data.totalCount / REVIEWS_PAGE_SIZE)),
          onPageChange: setPage,
        }
      : { status: 'loading' }

  return (
    <OwnerReviewsScreen
      data={data}
      onReport={async (reviewId, reason) => {
        try {
          await report.mutateAsync({ reviewId, reason })
          return null
        } catch (error) {
          return errorMessage(error)
        }
      }}
    />
  )
}
