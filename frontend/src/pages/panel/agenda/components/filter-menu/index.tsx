import { Select, SelectContent, SelectItem, SelectTrigger } from '@components/ui/select'

import type { FilterMenuProps } from './types'
import { cn } from 'cn'

const ALL = '__all__'

/**
 * Filtro em pílula: mostra o nome do filtro ou o que foi escolhido e abre a lista no toque, sobre o Select do shadcn
 * (Base UI: teclado e `aria-*`). Com escolha, a pílula ganha `action/soft` e a borda de foco — o estado não depende
 * só de cor, porque o texto também muda.
 */
export const FilterMenu = (props: FilterMenuProps) => {
  const { label, value, options, allLabel = 'Todos', onValueChange } = props
  const chosen = options.find((option) => option.value === value)
  const items = [{ value: ALL, label: allLabel }, ...options]

  return (
    <Select
      items={items}
      value={chosen ? chosen.value : ALL}
      onValueChange={(next) => next !== null && onValueChange(next === ALL ? null : next)}
    >
      <SelectTrigger
        aria-label={chosen ? `${label}: ${chosen.label}` : `${label}: ${allLabel}`}
        className={cn(
          'type-label h-auto! min-h-(--size-touch-min) gap-(--space-4) rounded-(--radius-full) border px-(--space-16) focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
          chosen
            ? 'border-(--border-focus) bg-(--action-soft) text-(--text-link) [&_svg]:text-(--text-link)!'
            : 'border-(--border-interactive) bg-(--bg-surface) text-(--text-body) hover:bg-(--bg-surface-raised) [&_svg]:text-(--text-muted)!',
        )}
      >
        <span className="max-w-40 truncate">{chosen ? chosen.label : label}</span>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align="start"
        className="min-w-48 rounded-md bg-(--bg-surface) p-(--space-4) text-(--text-strong) shadow-(--elevation-card) ring-(--border-subtle)"
      >
        {items.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="type-body min-h-(--size-touch-min) rounded-sm text-(--text-body) focus:bg-(--bg-surface-raised) focus:text-(--text-strong) data-selected:text-(--text-link)"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
