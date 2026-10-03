import type { ProfessionalOptionProps } from './types'
import { cn } from 'cn'

export const ProfessionalOption = (props: ProfessionalOptionProps) => {
  const { leading, title, details, onSelect, className } = props

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex min-h-(--size-touch-min) w-full items-center gap-(--space-12) px-(--space-2) py-(--space-12) text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
        className,
      )}
    >
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
        <span className="type-body text-(--text-strong)">{title}</span>
        {details.map((detail) => (
          <span key={detail} className="type-caption tabular text-(--text-muted)">
            {detail}
          </span>
        ))}
      </span>
    </button>
  )
}
