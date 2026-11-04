import { StarFilledIcon } from '@assets/icons'
import { cn } from 'cn'
import { ratingFormat } from '@components/card-establishment/consts'

export type RatingLabelProps = {
  /** Média de 1 a 5. Nula = o alvo é "Novo" (menos de 3 avaliações): não se mostra nota que ainda não existe. */
  average: number | null | undefined
  count: number
  className?: string
}

/**
 * "★ 4,8 (12)" ou "Novo". Quem lê com leitor de tela ouve "Nota 4,8 de 5, 12 avaliações" ou "Novo, ainda sem
 * avaliações suficientes": a estrela e o número não carregam o sentido sozinhos.
 */
export const RatingLabel = ({ average, count, className }: RatingLabelProps) => {
  if (average === null || average === undefined) {
    return (
      <span
        className={cn(
          'type-caption inline-flex items-center rounded-full border border-(--border-subtle) px-(--space-8) text-(--text-muted)',
          className,
        )}
      >
        Novo<span className="sr-only">, ainda sem avaliações suficientes</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'type-caption tabular inline-flex items-center gap-(--space-4) text-(--text-body)',
        className,
      )}
    >
      <StarFilledIcon aria-hidden="true" className="size-4 text-(--status-pending-fg)" />
      <span className="sr-only">
        Nota {ratingFormat.format(average)} de 5, {count} {count === 1 ? 'avaliação' : 'avaliações'}
      </span>
      <span aria-hidden="true">
        {ratingFormat.format(average)} ({count})
      </span>
    </span>
  )
}
