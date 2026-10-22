import {
  SEARCH_FILTERS,
  SEARCH_INITIAL_FILTERS,
  SEARCH_QUERY,
  SEARCH_RESULTS,
  SEARCH_RESULTS_TOTAL,
} from './mock'

import { ChevronLeft } from 'lucide-react'
import { FilterChip } from '@components/filter-chip'
import { SearchField } from '@components/search-field'
import { SearchResultCard } from '@components/search-result-card'
import type { SearchResultsScreenProps } from './types'
import { useState } from 'react'

/**
 * Tela 02 · Resultados da busca (Figma, 390px).
 */
export const SearchResultsScreen = (props: SearchResultsScreenProps) => {
  const { onBack } = props
  const [activeFilters, setActiveFilters] = useState(SEARCH_INITIAL_FILTERS)

  const toggleFilter = (id: string) => {
    setActiveFilters((current) =>
      current.includes(id) ? current.filter((filterId) => filterId !== id) : [...current, id],
    )
  }

  return (
    <div className="min-h-dvh bg-(--bg-page)">
      <header className="flex flex-col gap-(--space-12) border-b border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))] pb-(--space-12)">
        <div className="flex items-center gap-(--space-12)">
          <button
            type="button"
            aria-label="Voltar"
            onClick={onBack}
            className="flex size-(--size-touch-min) shrink-0 items-center justify-center text-(--text-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
          </button>
          <SearchField label="Buscar" defaultValue={SEARCH_QUERY} className="flex-1" />
        </div>

        <div
          role="group"
          aria-label="Filtros"
          className="-mx-(--space-16) flex gap-(--space-8) overflow-x-auto px-(--space-16)"
        >
          {SEARCH_FILTERS.map(({ id, label }) => (
            <FilterChip
              key={id}
              selected={activeFilters.includes(id)}
              onClick={() => toggleFilter(id)}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </header>

      <main className="flex flex-col gap-(--space-12) p-(--space-16) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))]">
        <h1 className="sr-only">Resultados da busca</h1>
        <p aria-live="polite" className="type-caption tabular text-(--text-muted)">
          {SEARCH_RESULTS_TOTAL} {SEARCH_RESULTS_TOTAL === 1 ? 'resultado' : 'resultados'}
        </p>

        <ul className="flex flex-col gap-(--space-12)">
          {SEARCH_RESULTS.map(({ id, ...result }) => (
            <li key={id}>
              <SearchResultCard {...result} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
