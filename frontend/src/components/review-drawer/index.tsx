import type { MyReviewResponse, SaveReviewRequest } from '@api/models'

import { Button } from '@components/button'
import { PanelSheet } from '@components/panel-sheet'
import { StarRatingInput } from '@components/star-rating-input'
import { TextAreaField } from '@components/text-area-field'
import { useState } from 'react'

export const REVIEW_COMMENT_MAX_LENGTH = 500

export type ReviewFormProps = {
  /** Para dar contexto: sobre qual estabelecimento é a avaliação. */
  businessName: string
  /** Estabelecimento de Saúde (LGPD Art. 11): o aviso para não escrever dado de saúde fica em destaque. */
  sensitive: boolean
  /** Presente = editando a avaliação que já existe (uma única vez). */
  existing: MyReviewResponse | null
  /** Envia. `null` se deu certo, senão a mensagem de erro em português. */
  onSubmit: (request: SaveReviewRequest) => Promise<string | null>
  onCancel: () => void
}

/**
 * O formulário da avaliação (ADR-032): nota do atendimento (obrigatória), nota do profissional (opcional) e comentário
 * de até 500 caracteres. O comentário é público: o texto avisa isso e, em Saúde, pede para não escrever dado de saúde.
 */
export const ReviewForm = (props: ReviewFormProps) => {
  const { businessName, sensitive, existing, onSubmit, onCancel } = props

  const [rating, setRating] = useState<number | null>(existing?.rating ?? null)
  const [professionalRating, setProfessionalRating] = useState<number | null>(
    existing?.professionalRating ?? null,
  )
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [ratingError, setRatingError] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  return (
    <form
      noValidate
      aria-label={existing ? 'Editar avaliação' : 'Avaliar atendimento'}
      className="flex flex-col gap-(--space-16)"
      onSubmit={async (event) => {
        event.preventDefault()
        if (rating === null) {
          setRatingError('Escolha de 1 a 5 estrelas para o atendimento.')
          return
        }
        setError(undefined)
        setBusy(true)
        const failure = await onSubmit({
          rating,
          professionalRating,
          comment: comment.trim() || null,
        })
        setBusy(false)
        if (failure) setError(failure)
      }}
    >
      <p className="type-body text-(--text-body)">Como foi o atendimento em {businessName}?</p>

      <div className="flex flex-col gap-(--space-4)">
        <span className="type-label text-(--text-body)">Atendimento</span>
        <StarRatingInput
          label="Nota do atendimento"
          value={rating}
          invalid={ratingError !== undefined}
          onValueChange={(next) => {
            setRating(next)
            setRatingError(undefined)
          }}
        />
        {ratingError && (
          <p role="alert" className="type-label text-(--status-rejected-fg)">
            {ratingError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-(--space-4)">
        <span className="type-label text-(--text-body)">Profissional (opcional)</span>
        <div className="flex flex-wrap items-center gap-(--space-8)">
          <StarRatingInput
            label="Nota do profissional"
            value={professionalRating}
            onValueChange={setProfessionalRating}
          />
          {professionalRating !== null && (
            <Button variant="ghost" onClick={() => setProfessionalRating(null)}>
              Não avaliar o profissional
            </Button>
          )}
        </div>
      </div>

      <TextAreaField
        id="review-comment"
        label="Comentário (opcional)"
        maxLength={REVIEW_COMMENT_MAX_LENGTH}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        helper={`${comment.length}/${REVIEW_COMMENT_MAX_LENGTH} caracteres.`}
      />

      <div
        role="note"
        className="type-caption flex flex-col gap-(--space-4) rounded-md border border-(--border-subtle) bg-(--bg-surface-raised) p-(--space-12) text-(--text-body)"
      >
        <p>
          Sua avaliação é pública. Seu nome aparece só com a inicial do sobrenome.
          {existing && ' Você pode editar a avaliação uma única vez.'}
        </p>
        {sensitive && (
          <p className="text-(--text-strong)">
            Este é um estabelecimento da área da saúde. <strong>Não escreva dados de saúde</strong>{' '}
            (diagnóstico, sintomas, tratamento, medicamentos) nem nomes de pessoas no comentário. O
            serviço que você fez também não aparece na avaliação.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {error}
        </p>
      )}

      <div className="flex gap-(--space-8)">
        <Button type="submit" disabled={busy}>
          {busy ? 'Enviando…' : existing ? 'Salvar alterações' : 'Enviar avaliação'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export type ReviewDrawerProps = Omit<ReviewFormProps, 'onCancel'> & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** A gaveta de "Avaliar atendimento" (de baixo no celular, lateral no desktop). O formulário monta a cada abertura. */
export const ReviewDrawer = ({ open, onOpenChange, ...form }: ReviewDrawerProps) => (
  <PanelSheet
    open={open}
    onOpenChange={onOpenChange}
    title={form.existing ? 'Editar avaliação' : 'Avaliar atendimento'}
  >
    <ReviewForm {...form} onCancel={() => onOpenChange(false)} />
  </PanelSheet>
)
