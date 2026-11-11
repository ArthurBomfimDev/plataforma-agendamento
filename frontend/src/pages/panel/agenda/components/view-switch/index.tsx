import { AGENDA_VIEWS } from '@pages/panel/agenda/filters'
import type { ViewSwitchProps } from './types'
import { cn } from 'cn'

/**
 * "Dia · Semana" da tela 09, com "Mês" (Onda 7CF): botões separados, o escolhido em `action/soft` com a borda de
 * foco. O Figma desenha 36px de altura; aqui são 44px, o alvo de toque do painel (CLAUDE.md §3.1).
 */
export const ViewSwitch = ({ value, onValueChange, className }: ViewSwitchProps) => (
  <div
    role="group"
    aria-label="Visualização da agenda"
    className={cn('flex gap-(--space-8)', className)}
  >
    {AGENDA_VIEWS.map((view) => (
      <button
        key={view.value}
        type="button"
        aria-pressed={view.value === value}
        onClick={() => onValueChange(view.value)}
        className="type-label min-h-(--size-touch-min) rounded-md border border-(--border-interactive) bg-(--bg-surface) px-(--space-16) text-(--text-body) transition-colors hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) aria-pressed:border-(--border-focus) aria-pressed:bg-(--action-soft) aria-pressed:text-(--text-link)"
      >
        {view.label}
      </button>
    ))}
  </div>
)
