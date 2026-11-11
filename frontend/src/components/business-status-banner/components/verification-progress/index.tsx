import { TONE_CLASSES } from '../../consts'
import type { VerificationProgressProps } from './types'
import { cn } from 'cn'

/**
 * Progresso da verificação: o texto "X de Y concluídos" e um segmento por item (Figma `Progresso`).
 * Os segmentos preenchidos são os concluídos; os vazios têm só a borda. Na faixa eles têm largura fixa;
 * no modal de primeiro acesso, `fill` os estica pela largura toda.
 */
export const VerificationProgress = (props: VerificationProgressProps) => {
  const { done, total, tone, fill = false, className } = props
  const classes = TONE_CLASSES[tone]

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="type-caption whitespace-nowrap text-(--text-body)">
        {done} de {total} concluídos
      </p>
      <div role="group" aria-label={`${done} de ${total} concluídos`} className="flex gap-1">
        {Array.from({ length: total }, (_, index) => (
          <span
            // A lista de segmentos é fixa para um mesmo `total`: o índice é a identidade.
            key={index}
            aria-hidden="true"
            data-segment={index < done ? 'done' : 'pending'}
            className={cn(
              'h-1.5 rounded-full',
              fill ? 'min-w-0 flex-1' : 'w-[26px]',
              index < done
                ? classes.segment
                : cn('border bg-(--bg-surface)', classes.segmentOutline),
            )}
          />
        ))}
      </div>
    </div>
  )
}
