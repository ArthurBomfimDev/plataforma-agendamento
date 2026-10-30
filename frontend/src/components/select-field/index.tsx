import type { SelectFieldProps } from './types'
import { X } from 'lucide-react'
import { cn } from 'cn'

/** Mesmo desenho do seletor da marcação de balcão: altura de toque, borda interativa, foco visível. */
export const SELECT_CLASSES =
  'min-h-(--size-touch-min) w-full rounded-md border border-(--border-interactive) bg-(--bg-surface) px-(--space-16) py-(--space-12) text-(length:--size-input) text-(--text-strong) focus-visible:border-(--border-focus) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) disabled:bg-(--bg-disabled) disabled:text-(--text-disabled)'

/**
 * Seletor nativo com rótulo e erro. Nativo de propósito: no celular abre o seletor do sistema, e leitor
 * de tela e teclado já funcionam.
 */
export const SelectField = (props: SelectFieldProps) => {
  const { id, label, helper, error, options, className, ...select } = props
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined

  return (
    <div className={cn('flex flex-col gap-(--space-4)', className)}>
      <label htmlFor={id} className="type-label text-(--text-body)">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(SELECT_CLASSES, error && 'border-2 border-(--status-rejected-fg)')}
        {...select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p
          id={`${id}-error`}
          className="type-caption flex items-center gap-(--space-4) text-(--status-rejected-fg)"
        >
          <X aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : (
        helper && (
          <p id={`${id}-helper`} className="type-caption text-(--text-muted)">
            {helper}
          </p>
        )
      )}
    </div>
  )
}
