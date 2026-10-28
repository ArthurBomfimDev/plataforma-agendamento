import type { ProfessionalPickerProps } from './types'
import { X } from 'lucide-react'
import { cn } from 'cn'
import { memo } from 'react'

/**
 * "Quem executa este serviço": um botão liga/desliga por profissional. Escolhido = preenchimento
 * sólido, como no Figma; o estado vai também em `aria-pressed`, não só na cor.
 *
 * Memorizado com o `onToggle` estável da tela: digitar nos campos não redesenha os botões.
 */
export const ProfessionalPicker = memo((props: ProfessionalPickerProps) => {
  const { id, professionals, selectedIds, onToggle, error } = props

  const errorId = `${id}-error`

  return (
    <fieldset
      id={id}
      aria-describedby={error ? errorId : undefined}
      className="flex flex-col gap-(--space-8)"
    >
      <legend className="type-caption mb-(--space-8) text-(--text-muted)">
        Quem executa este serviço
      </legend>
      <div className="flex flex-wrap gap-(--space-8)">
        {professionals.map((professional) => {
          const selected = selectedIds.includes(professional.id)
          return (
            <button
              key={professional.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(professional.id)}
              className={cn(
                'type-label flex min-h-(--size-touch-min) items-center rounded-(--radius-full) border px-(--space-16) py-(--space-8) whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
                selected
                  ? 'border-(--action-primary) bg-(--action-primary) text-(--text-on-action) hover:bg-(--action-primary-hover)'
                  : 'border-(--border-interactive) bg-(--bg-surface) text-(--text-body) hover:bg-(--bg-surface-raised)',
              )}
            >
              {professional.name}
            </button>
          )
        })}
      </div>
      {error && (
        <p
          id={errorId}
          className="type-caption flex items-center gap-(--space-4) text-(--status-rejected-fg)"
        >
          <X aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </fieldset>
  )
})
