import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { StarFilledIcon, StarIcon } from '@assets/icons'
import { cn } from 'cn'

const STAR_VALUES = [1, 2, 3, 4, 5] as const

export type StarRatingInputProps = {
  /** O texto que o leitor de tela lê para o grupo, por exemplo "Nota do atendimento". */
  label: string
  /** `null`: ainda sem nota escolhida. */
  value: number | null
  onValueChange: (value: number) => void
  disabled?: boolean
  invalid?: boolean
  className?: string
}

const starName = (value: number) => `${value} ${value === 1 ? 'estrela' : 'estrelas'}`

/**
 * Cinco estrelas como grupo de opções exclusivas (`role="radiogroup"`): as setas trocam a nota, Tab entra e sai do
 * grupo, e cada estrela é lida como "3 estrelas". Alvo de toque de 44 px por estrela. O preenchimento acompanha a
 * nota escolhida, mas a seleção também é dita pelo `aria-checked`, não só pela cor.
 */
export const StarRatingInput = (props: StarRatingInputProps) => {
  const { label, value, onValueChange, disabled, invalid, className } = props

  return (
    <RadioGroup
      aria-label={label}
      aria-invalid={invalid ? true : undefined}
      value={value === null ? '' : String(value)}
      onValueChange={(next) => onValueChange(Number(next))}
      disabled={disabled}
      className={cn('flex flex-row', className)}
    >
      {STAR_VALUES.map((star) => {
        const filled = value !== null && star <= value
        const Icon = filled ? StarFilledIcon : StarIcon

        return (
          <Radio.Root
            key={star}
            value={String(star)}
            aria-label={starName(star)}
            className="flex size-(--size-touch-min) cursor-pointer items-center justify-center rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              aria-hidden="true"
              className={cn(
                'size-8',
                filled ? 'text-(--status-pending-fg)' : 'text-(--border-interactive)',
              )}
            />
          </Radio.Root>
        )
      })}
    </RadioGroup>
  )
}
