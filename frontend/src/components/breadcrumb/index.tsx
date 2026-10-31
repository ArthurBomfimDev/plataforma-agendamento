import type { BreadcrumbProps } from './types'
import { ChevronRightIcon } from '@assets/icons'

/**
 * Trilha de navegação do desktop (Figma, 04D e 05D). No celular o caminho de volta é o botão
 * do cabeçalho.
 */
export const Breadcrumb = (props: BreadcrumbProps) => {
  const { items, className } = props

  return (
    <nav aria-label="Trilha de navegação" className={className}>
      <ol className="type-caption flex flex-wrap items-center gap-(--space-8)">
        {items.map(({ label, onClick }, index) => (
          <li key={label} className="flex items-center gap-(--space-8)">
            {index > 0 && (
              <ChevronRightIcon aria-hidden="true" className="size-3.5 text-(--text-strong)" />
            )}
            {onClick ? (
              <button
                type="button"
                onClick={onClick}
                // A linha tem 16px; o `py` leva o alvo de toque a 44px sem crescer a trilha.
                className="-my-3.5 py-3.5 text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
              >
                {label}
              </button>
            ) : (
              <span aria-current="page" className="tabular text-(--text-muted)">
                {label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
