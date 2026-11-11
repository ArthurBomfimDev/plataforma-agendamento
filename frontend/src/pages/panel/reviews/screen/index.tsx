import { ErrorState, LoadingState } from '@components/screen-state'
import { PANEL_CARD, PanelPage } from '@components/panel-page'

import { Button } from '@components/button'
import type { OwnerReviewResponse } from '@api/models'
import { TextField } from '@components/text-field'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useState } from 'react'

export type OwnerReviewsData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | {
      status: 'ready'
      items: OwnerReviewResponse[]
      page: number
      totalPages: number
      onPageChange: (page: number) => void
    }

export type OwnerReviewsScreenProps = {
  data: OwnerReviewsData
  /** Denuncia. `null` se deu certo, senão a mensagem de erro em português. */
  onReport: (reviewId: string, reason: string) => Promise<string | null>
}

const TITLE = 'Avaliações'
const SUBTITLE = 'O que os consumidores disseram. Você não apaga nem responde; pode denunciar.'
const REASON_MIN = 5
const REASON_MAX = 500

const ReviewCard = (props: {
  review: OwnerReviewResponse
  onReport: OwnerReviewsScreenProps['onReport']
}) => {
  const { review, onReport } = props
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  return (
    <article className={PANEL_CARD}>
      <h2 className="type-label text-(--text-strong)">
        {review.rating} de 5 · {review.reviewerName}
      </h2>
      <p className="type-caption text-(--text-muted)">
        {format(new Date(review.reviewedAt), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
        {review.serviceName && ` · ${review.serviceName}`}
      </p>
      {review.comment && <p className="type-body break-words">{review.comment}</p>}
      {review.professionalRating !== null && (
        <p className="type-caption text-(--text-muted)">
          Nota do profissional: {review.professionalRating} de 5
        </p>
      )}

      {review.reported ? (
        <p role="status" className="type-caption text-(--text-muted)">
          Denúncia enviada. A administração decide; a avaliação segue no ar até lá.
        </p>
      ) : open ? (
        <form
          noValidate
          aria-label="Denunciar avaliação"
          className="flex flex-col gap-(--space-8)"
          onSubmit={async (event) => {
            event.preventDefault()
            const text = reason.trim()
            if (text.length < REASON_MIN) {
              setFieldError(`Escreva ao menos ${REASON_MIN} caracteres.`)
              return
            }
            setError(undefined)
            setBusy(true)
            const failure = await onReport(review.id, text)
            setBusy(false)
            if (failure) setError(failure)
          }}
        >
          <TextField
            id={`report-reason-${review.id}`}
            label="Por que esta avaliação deve sair?"
            helper="Vai só para a administração."
            maxLength={REASON_MAX}
            value={reason}
            error={fieldError}
            onChange={(event) => {
              setReason(event.target.value)
              setFieldError(undefined)
            }}
          />
          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}
          <div className="flex gap-(--space-8)">
            <Button type="submit" variant="secondary" disabled={busy}>
              {busy ? 'Enviando…' : 'Enviar denúncia'}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="ghost"
          className="self-start"
          aria-label={`Denunciar a avaliação de ${review.reviewerName}`}
          onClick={() => setOpen(true)}
        >
          Denunciar
        </Button>
      )}
    </article>
  )
}

/**
 * Painel — Avaliações, só do dono (ADR-032): lê o que os consumidores escreveram e denuncia o que for abusivo. A
 * denúncia vai para a fila do Admin. Não há resposta do dono nem exclusão: é limitação registrada.
 */
export const OwnerReviewsScreen = ({ data, onReport }: OwnerReviewsScreenProps) => (
  <PanelPage title={TITLE} subtitle={SUBTITLE}>
    {data.status === 'loading' && <LoadingState label="Carregando as avaliações…" />}
    {data.status === 'error' && <ErrorState message={data.message} onRetry={data.onRetry} />}
    {data.status === 'ready' && data.items.length === 0 && (
      <p className="type-body text-(--text-muted)">
        Ainda não há avaliações. Elas aparecem aqui depois que os atendimentos forem concluídos.
      </p>
    )}
    {data.status === 'ready' && data.items.length > 0 && (
      <>
        <ul aria-label="Avaliações do estabelecimento" className="flex flex-col gap-(--space-12)">
          {data.items.map((review) => (
            <li key={review.id}>
              <ReviewCard review={review} onReport={onReport} />
            </li>
          ))}
        </ul>
        {data.totalPages > 1 && (
          <nav aria-label="Páginas de avaliações" className="flex items-center gap-(--space-12)">
            <Button
              variant="secondary"
              disabled={data.page <= 1}
              onClick={() => data.onPageChange(data.page - 1)}
            >
              Anteriores
            </Button>
            <span className="type-caption tabular text-(--text-muted)">
              Página {data.page} de {data.totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={data.page >= data.totalPages}
              onClick={() => data.onPageChange(data.page + 1)}
            >
              Próximas
            </Button>
          </nav>
        )}
      </>
    )}
  </PanelPage>
)
