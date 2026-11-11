import type { SwitchFieldProps } from './types'
import { cn } from 'cn'

/**
 * Liga/desliga de formulário: um `checkbox` nativo com `role="switch"`, dentro de um rótulo do tamanho
 * do alvo de toque (a linha inteira clica). O estado é lido pelo leitor de tela e aparece no texto
 * ("Ligada"/"Desligada"), não só na cor.
 */
export const SwitchField = (props: SwitchFieldProps) => {
  const { id, label, description, checked, disabled, onCheckedChange, className } = props

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex min-h-(--size-touch-min) cursor-pointer items-center gap-(--space-12) rounded-md py-(--space-8) has-disabled:cursor-not-allowed',
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
        <span id={`${id}-label`} className="type-label text-(--text-strong)">
          {label}
        </span>
        {description && (
          <span id={`${id}-description`} className="type-caption text-(--text-muted)">
            {description}
          </span>
        )}
      </span>
      <span className="type-caption shrink-0 text-(--text-muted)" aria-hidden="true">
        {checked ? 'Ligada' : 'Desligada'}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        // O nome é só o rótulo; o efeito vai na descrição, lida depois.
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="size-6 shrink-0 cursor-pointer accent-(--action-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) disabled:cursor-not-allowed"
      />
    </label>
  )
}
