import { PENDING_BADGE, SECTIONS } from './consts'

import type { PanelSidebarProps } from './types'

/**
 * Navegação lateral do painel do estabelecimento, só no desktop (tela 09). No celular quem navega
 * é a `PanelBottomNavigation`.
 */
export const PanelSidebar = (props: PanelSidebarProps) => {
  const {
    businessName,
    activeSection,
    pendingRequests,
    onNavigate,
    hiddenSections = [],
    footer,
  } = props
  const sections = SECTIONS.filter(({ id }) => !hiddenSections.includes(id))

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-(--space-24) overflow-y-auto border-r border-(--border-subtle) bg-(--bg-surface) px-(--space-12) py-(--space-24) lg:flex">
      <div className="flex items-center gap-(--space-8) px-(--space-8) py-(--space-2)">
        {/* TODO(figma): o wireframe deixa um quadrado neutro no lugar do logo do estabelecimento. */}
        <div aria-hidden="true" className="size-8 shrink-0 rounded-md bg-(--bg-disabled)" />
        <div className="flex min-w-0 flex-col gap-(--space-2)">
          <p className="type-label truncate text-(--text-strong)">{businessName}</p>
          <p className="type-caption text-(--text-muted)">Painel do estabelecimento</p>
        </div>
      </div>

      <nav aria-label="Painel do estabelecimento">
        <ul className="flex flex-col gap-(--space-2)">
          {sections.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                aria-current={id === activeSection ? 'page' : undefined}
                onClick={() => onNavigate?.(id)}
                className="type-label flex min-h-(--size-touch-min) w-full items-center gap-(--space-12) rounded-md px-(--space-12) py-(--space-8) text-left text-(--text-body) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) aria-[current=page]:bg-(--action-soft) aria-[current=page]:text-(--text-link)"
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                <span className="min-w-0 flex-1">{label}</span>
                {id === 'requests' && pendingRequests > 0 && (
                  <span className={PENDING_BADGE}>
                    {pendingRequests}
                    <span className="sr-only"> pendentes</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {footer && <div className="mt-auto">{footer}</div>}
    </aside>
  )
}
