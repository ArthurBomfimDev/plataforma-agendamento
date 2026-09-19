import type { BottomNavigationProps } from './types'
import { ITEMS } from './conts'

/**
 * Navegação inferior, fixa. Respeita a safe-area do dispositivo (regra 6 de empacotamento) e
 * mantém 44px de alvo de toque em cada aba.
 */
export const BottomNavigation = (props: BottomNavigationProps) => {
  const { activeItem, onNavigate } = props

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-(--space-8) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] shadow-[0_-2px_8px_0_rgb(28_26_23/0.08)]"
    >
      <ul className="flex gap-(--space-8)">
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <li key={id} className="flex-1">
            <button
              type="button"
              aria-current={id === activeItem ? 'page' : undefined}
              onClick={() => onNavigate?.(id)}
              className="type-caption flex min-h-(--size-touch-min) w-full flex-col items-center justify-center gap-(--space-4) text-(--text-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) aria-[current=page]:text-(--text-link)"
            >
              <Icon aria-hidden="true" className="size-6" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
