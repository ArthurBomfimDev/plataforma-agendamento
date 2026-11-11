import { END_OF_DAY, TIME_STEP_MINUTES, normalizeTime, timeOptions } from './consts'
import { FIELD_BOX_CLASSES, FIELD_LABEL_CLASSES } from '@components/text-field/consts'

import { CloseIcon } from '@assets/icons'
import type { TimeFieldProps } from './types'
import { cn } from 'cn'

/**
 * Campo de horário: uma lista de `HH:mm` de 15 em 15 minutos, no lugar do `<input type="time">`. O seletor nativo de
 * hora tem tamanho e comportamento diferentes em cada aparelho e navegador, e no Chrome do Android o botão "Definir"
 * chegou a ficar fora da tela (11/11, tela de jornada), sem como confirmar. A lista nativa (`<select>`) abre o seletor
 * do sistema, que cabe na tela, e dá teclado e leitor de tela de graça.
 *
 * A grade é a granularidade do produto: o calculador de disponibilidade corta o dia nesses passos, então a lista não
 * oferece horário que ele não saiba tratar. Um valor já salvo fora da grade continua na lista.
 *
 * Alvo de toque de 44 px e fonte de 16 px (sem zoom automático no iOS) vêm da caixa de campo do projeto. O valor é `HH:mm`.
 */
export const TimeField = (props: TimeFieldProps) => {
  const {
    id,
    label,
    value,
    onValueChange,
    stepMinutes = TIME_STEP_MINUTES,
    endOfDay = false,
    error,
    disabled,
    className,
    labelClassName,
  } = props

  const current = normalizeTime(value)
  const errorId = `${id}-error`

  return (
    <div className={cn('flex flex-col gap-(--space-4)', className)}>
      <label htmlFor={id} className={cn(FIELD_LABEL_CLASSES, labelClassName)}>
        {label}
      </label>
      <select
        id={id}
        value={current}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          FIELD_BOX_CLASSES,
          'tabular w-full min-w-0 cursor-pointer aria-invalid:border-2 aria-invalid:border-(--border-error) aria-invalid:px-[calc(var(--space-16)-1px)] aria-invalid:py-[calc(var(--space-12)-1px)]',
          !current && 'text-(--text-muted)',
        )}
      >
        {!current && (
          <option value="" disabled>
            --:--
          </option>
        )}
        {timeOptions(stepMinutes, current, { endOfDay }).map((time) => (
          <option key={time} value={time}>
            {time === END_OF_DAY ? `${time} (fim do dia)` : time}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={errorId}
          className="type-caption flex items-center gap-(--space-4) text-(--status-rejected-fg)"
        >
          <CloseIcon aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
