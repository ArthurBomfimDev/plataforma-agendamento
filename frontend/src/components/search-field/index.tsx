import { Search } from 'lucide-react'
import type { SearchFieldProps } from './types'
import { cn } from 'cn'

export const SearchField = (props: SearchFieldProps) => {
  const { label, className, ...inputProps } = props

  return (
    <label
      className={cn(
        'flex min-h-(--size-touch-min) items-center gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-surface-raised) px-(--space-16) py-(--space-12) focus-within:border-(--border-focus) focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--border-focus)',
        className,
      )}
    >
      <Search aria-hidden="true" className="size-5 shrink-0 text-(--text-muted)" />
      {/* Campo de formulário é 16px sempre — abaixo disso o Safari do iOS dá zoom no foco. */}
      <input
        {...inputProps}
        type="search"
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent text-(length:--size-input) leading-(--line-height-input) text-(--text-strong) outline-none placeholder:text-(--text-muted)"
      />
    </label>
  )
}
