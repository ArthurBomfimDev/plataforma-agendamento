import type { BottomNavigationProps } from './types'
import { VARIANT_CLASSES } from './consts'
import { cn } from 'cn'

/**
 * Navegação inferior, fixa, do consumidor e do painel. Respeita a safe-area do dispositivo (regra 6 de
 * empacotamento) e mantém 44px de alvo de toque em cada aba. No desktop some: lá a navegação é outra.
 */
export const BottomNavigation = <TItem extends string>(props: BottomNavigationProps<TItem>) => {
  const { items, activeItem, onNavigate, label, variant = 'app', badges, action } = props
  const classes = VARIANT_CLASSES[variant]

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-10 flex flex-col gap-(--space-8) border-t border-(--border-subtle) bg-(--bg-surface) px-(--space-16) shadow-(--elevation-bar) md:px-[max(var(--space-16),calc((100%-40rem)/2+var(--space-16)))] lg:hidden',
        classes.bar,
      )}
    >
      {action}
      <nav aria-label={label}>
        <ul className={cn('flex', classes.list)}>
          {items.map(({ id, label: itemLabel, icon: Icon }) => (
            <li key={id} className="flex-1">
              <button
                type="button"
                aria-current={id === activeItem ? 'page' : undefined}
                onClick={() => onNavigate?.(id)}
                className={cn(
                  'type-caption flex min-h-(--size-touch-min) w-full flex-col items-center justify-center text-(--text-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) aria-[current=page]:text-(--text-link)',
                  classes.button,
                )}
              >
                <span className="flex items-center gap-(--space-2)">
                  <Icon aria-hidden="true" className="size-6" />
                  {badges?.[id]}
                </span>
                {itemLabel}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
