import type { ToggleChipsProps } from './types'
import { cn } from 'cn'

/**
 * Vários liga/desliga lado a lado, no desenho de "Quem executa este serviço" (tela 11): escolhido =
 * preenchimento sólido, e o estado vai também em `aria-pressed`, não só na cor.
 */
export const ToggleChips = (props: ToggleChipsProps) => {
  const { id, legend, options, selectedIds, onToggle, empty, disabled } = props

  return (
    <fieldset id={id} className="flex flex-col gap-(--space-8)" disabled={disabled}>
      <legend className="type-label mb-(--space-8) text-(--text-body)">{legend}</legend>
      {options.length === 0 ? (
        <p className="type-caption text-(--text-muted)">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-(--space-8)">
          {options.map((option) => {
            const selected = selectedIds.includes(option.id)
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle(option.id)}
                className={cn(
                  'type-label flex min-h-(--size-touch-min) items-center rounded-(--radius-full) border px-(--space-16) py-(--space-8) text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) disabled:cursor-not-allowed disabled:opacity-60',
                  selected
                    ? 'border-(--action-primary) bg-(--action-primary) text-(--text-on-action) hover:bg-(--action-primary-hover)'
                    : 'border-(--border-interactive) bg-(--bg-surface) text-(--text-body) hover:bg-(--bg-surface-raised)',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}
