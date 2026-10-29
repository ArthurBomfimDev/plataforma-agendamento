import { ITEMS } from './consts'
import { PENDING_BADGE } from '@components/panel-sidebar/consts'
import type { PanelBottomNavigationProps } from './types'
import { cn } from 'cn'

/**
 * Navegação inferior do painel no celular (P01), fixa, com a ação principal da tela por cima.
 * Respeita a safe-area (regra 6 de empacotamento) e mantém 44px de alvo de toque em cada aba.
 */
export const PanelBottomNavigation = (props: PanelBottomNavigationProps) => {
  const { activeItem, pendingRequests, onNavigate, action } = props

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex flex-col gap-(--space-8) border-t border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-(--space-12) pb-[calc(var(--space-8)+env(safe-area-inset-bottom))] shadow-[0_-2px_10px_0_rgb(20_20_18/0.1)] md:px-[max(var(--space-16),calc((100%-40rem)/2+var(--space-16)))] lg:hidden">
      {action}
      <nav aria-label="Painel do estabelecimento">
        <ul className="flex gap-(--space-2)">
          {ITEMS.map(({ id, label, icon: Icon }) => (
            <li key={id} className="flex-1">
              <button
                type="button"
                aria-current={id === activeItem ? 'page' : undefined}
                onClick={() => onNavigate?.(id)}
                className="type-caption flex min-h-(--size-touch-min) w-full flex-col items-center justify-center gap-(--space-2) px-(--space-4) pt-(--space-8) pb-(--space-4) text-(--text-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) aria-[current=page]:text-(--text-link)"
              >
                <span className="flex items-center gap-(--space-2)">
                  <Icon aria-hidden="true" className="size-6" />
                  {id === 'requests' && pendingRequests > 0 && (
                    <span
                      className={cn(
                        PENDING_BADGE,
                        'border border-(--status-pending-fg) px-(--space-4)',
                      )}
                    >
                      {pendingRequests}
                      <span className="sr-only"> pendentes</span>
                    </span>
                  )}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
