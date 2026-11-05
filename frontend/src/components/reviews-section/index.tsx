import type { PublicReviewResponse, RatingSummaryResponse } from '@api/models'
import { StarFilledIcon, StarIcon } from '@assets/icons'

import { Button } from '@components/button'
import { RatingLabel } from '@components/rating-label'
import { cn } from 'cn'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ratingFormat } from '@components/card-establishment/consts'

/** O mínimo de avaliações para a média aparecer (o servidor decide; aqui só explica ao leitor). */
export const MIN_REVIEWS_FOR_AVERAGE = 3

export type ReviewsListState =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry?: () => void }
  | {
      status: 'ready'
      items: PublicReviewResponse[]
      page: number
      totalPages: number
      onPageChange: (page: number) => void
    }

export type ReviewsSectionProps = {
  /** Título do bloco, por exemplo "Avaliações" ou "Avaliações de Ana". */
  title: string
  summary:
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: RatingSummaryResponse }
  list: ReviewsListState
  className?: string
}

const Stars = ({ value, label }: { value: number; label: string }) => (
  <span role="img" aria-label={label} className="inline-flex">
    {[1, 2, 3, 4, 5].map((star) =>
      star <= value ? (
        <StarFilledIcon
          key={star}
          aria-hidden="true"
          className="size-4 text-(--status-pending-fg)"
        />
      ) : (
        <StarIcon key={star} aria-hidden="true" className="size-4 text-(--border-interactive)" />
      ),
    )}
  </span>
)

const dateLabel = (iso: string) => format(new Date(iso), "d 'de' MMM 'de' yyyy", { locale: ptBR })

const Summary = ({ data }: { data: RatingSummaryResponse }) => {
  const total = data.distribution.reduce((sum, n) => sum + n, 0)

  if (data.isNew || data.average === null) {
    return (
      <div className="flex flex-col gap-(--space-4)">
        <RatingLabel average={null} count={data.count} />
        <p className="type-caption text-(--text-muted)">
          A média aparece a partir de {MIN_REVIEWS_FOR_AVERAGE} avaliações.
          {data.count > 0 &&
            ` Por enquanto, ${data.count} ${data.count === 1 ? 'avaliação' : 'avaliações'}.`}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-(--space-12) sm:flex-row sm:items-center sm:gap-(--space-24)">
      <div className="flex flex-col gap-(--space-4)">
        <p className="type-display tabular text-(--text-strong)">
          {ratingFormat.format(data.average)}
        </p>
        <Stars
          value={Math.round(data.average)}
          label={`Média ${ratingFormat.format(data.average)} de 5`}
        />
        <p className="type-caption text-(--text-muted)">
          {data.count} {data.count === 1 ? 'avaliação' : 'avaliações'}
        </p>
      </div>
      <ul
        aria-label="Quantidade de avaliações por nota"
        className="flex min-w-0 flex-1 flex-col gap-(--space-4)"
      >
        {[5, 4, 3, 2, 1].map((star) => {
          const count = data.distribution[star - 1] ?? 0
          return (
            <li
              key={star}
              className="type-caption tabular flex items-center gap-(--space-8) text-(--text-muted)"
            >
              <span className="w-14 shrink-0">
                {star} {star === 1 ? 'estrela' : 'estrelas'}
              </span>
              <span
                aria-hidden="true"
                className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-(--bg-surface-raised)"
              >
                <span
                  className="block h-full rounded-full bg-(--status-pending-fg)"
                  style={{ width: `${total === 0 ? 0 : (count / total) * 100}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right">{count}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Avaliações públicas de um estabelecimento ou profissional (ADR-032): nota, distribuição e lista paginada. O nome é
 * sempre "Ana S."; em Saúde o servidor não manda o serviço, então ele simplesmente não aparece.
 */
export const ReviewsSection = ({ title, summary, list, className }: ReviewsSectionProps) => (
  <section
    aria-labelledby="reviews-title"
    className={cn('flex flex-col gap-(--space-16)', className)}
  >
    <h2 id="reviews-title" className="type-heading text-(--text-strong)">
      {title}
    </h2>

    {summary.status === 'loading' && (
      <p role="status" className="type-body text-(--text-muted)">
        Carregando a nota…
      </p>
    )}
    {summary.status === 'ready' && <Summary data={summary.data} />}

    {list.status === 'loading' && (
      <p role="status" className="type-body text-(--text-muted)">
        Carregando avaliações…
      </p>
    )}
    {list.status === 'error' && (
      <div role="alert" className="flex flex-col items-start gap-(--space-12)">
        <p className="type-body text-(--text-muted)">{list.message}</p>
        {list.onRetry && (
          <Button variant="secondary" onClick={list.onRetry}>
            Tentar de novo
          </Button>
        )}
      </div>
    )}
    {list.status === 'ready' && list.items.length === 0 && (
      <p className="type-body text-(--text-muted)">
        Ainda não há avaliações. Quem agendar e for atendido pode avaliar.
      </p>
    )}
    {list.status === 'ready' && list.items.length > 0 && (
      <>
        <ul className="flex flex-col gap-(--space-16)">
          {list.items.map((review) => (
            <li
              key={review.id}
              className="flex flex-col gap-(--space-4) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)"
            >
              <div className="flex flex-wrap items-center gap-x-(--space-8) gap-y-(--space-2)">
                <Stars value={review.rating} label={`Nota ${review.rating} de 5`} />
                <span className="type-label text-(--text-strong)">{review.reviewerName}</span>
                <time dateTime={review.reviewedAt} className="type-caption text-(--text-muted)">
                  {dateLabel(review.reviewedAt)}
                </time>
              </div>
              {review.serviceName && (
                <p className="type-caption text-(--text-muted)">{review.serviceName}</p>
              )}
              {review.comment && <p className="type-body text-(--text-body)">{review.comment}</p>}
              {review.professionalRating !== null && (
                <p className="type-caption text-(--text-muted)">
                  Nota do profissional: {review.professionalRating} de 5
                </p>
              )}
            </li>
          ))}
        </ul>
        {list.totalPages > 1 && (
          <nav aria-label="Páginas de avaliações" className="flex items-center gap-(--space-12)">
            <Button
              variant="secondary"
              disabled={list.page <= 1}
              onClick={() => list.onPageChange(list.page - 1)}
            >
              Anteriores
            </Button>
            <span className="type-caption tabular text-(--text-muted)">
              Página {list.page} de {list.totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={list.page >= list.totalPages}
              onClick={() => list.onPageChange(list.page + 1)}
            >
              Próximas
            </Button>
          </nav>
        )}
      </>
    )}
  </section>
)
