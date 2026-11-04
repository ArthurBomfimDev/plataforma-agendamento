import { cn } from 'cn'
import { initialsOf } from './initials-of'

/**
 * Avatar padrão do profissional sem foto (design system: iniciais sobre `action/soft`). Sem arquivo e sem banco:
 * só o nome. Decorativo quando o nome já está escrito ao lado.
 */
export const InitialsAvatar = ({ name, className }: { name: string; className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      'type-label flex size-full items-center justify-center rounded-(--radius-full) bg-(--action-soft) font-semibold text-(--text-link) select-none',
      className,
    )}
  >
    {initialsOf(name)}
  </span>
)
