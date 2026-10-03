import { Search } from 'lucide-react'
import type { SearchFieldProps } from './types'
import { cn } from 'cn'

export const SearchField = (props: SearchFieldProps) => {
  const { label, action, className, inputClassName, ...inputProps } = props

  return (
    // A moldura é um `div` e não o `label`: um botão dentro de `<label>` é HTML inválido.
    // O contorno de foco segue só o campo, não a ação ao lado.
    <div
      className={cn(
        'flex min-h-(--size-touch-min) items-center gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-surface-raised) px-(--space-16) py-(--space-12) has-[input:focus-visible]:border-(--border-focus) has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-(--border-focus)',
        className,
      )}
    >
      <label className="flex min-w-0 flex-1 items-center gap-(--space-8)">
        <Search aria-hidden="true" className="size-5 shrink-0 text-(--text-muted)" />
        {/* Campo de formulário é 16px sempre — abaixo disso o Safari do iOS dá zoom no foco. */}
        <input
          {...inputProps}
          type="search"
          aria-label={label}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-(length:--size-input) leading-(--line-height-input) text-(--text-strong) outline-none placeholder:text-(--text-muted)',
            inputClassName,
          )}
        />
      </label>
      {action}
    </div>
  )
}
