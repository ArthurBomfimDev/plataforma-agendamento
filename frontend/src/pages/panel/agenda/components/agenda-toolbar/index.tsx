import { AGENDA_STATUSES, hasAgendaFilters } from '@pages/panel/agenda/filters'
import { useEffect, useState } from 'react'

import type { AgendaToolbarProps } from './types'
import { CloseIcon } from '@assets/icons'
import { FilterMenu } from '../filter-menu'
import { SEARCH_DEBOUNCE_MS } from './consts'
import { SearchField } from '@components/search-field'
import { cn } from 'cn'

/**
 * Filtros da agenda (Onda 7CF): a busca pelo nome de quem vai ser atendido, que filtra enquanto se digita, e as
 * pílulas de profissional, status e serviço, que abrem a lista no toque. Tudo vai para a URL pela rota: o link, o
 * voltar e o recarregar guardam o recorte. No celular, as pílulas rolam na horizontal.
 *
 * O profissional não vê o filtro de profissional: a API já devolve só a agenda dele.
 */
export const AgendaToolbar = (props: AgendaToolbarProps) => {
  const { filters, professionals, services, showProfessionalFilter, onChange, className } = props
  const [query, setQuery] = useState(filters.query ?? '')
  const [urlQuery, setUrlQuery] = useState(filters.query)

  // A URL manda (voltar no histórico, limpar): o campo acompanha, ajustado na renderização.
  if (filters.query !== urlQuery) {
    setUrlQuery(filters.query)
    setQuery(filters.query ?? '')
  }

  // Filtra enquanto digita, sem empilhar uma entrada no histórico por letra.
  useEffect(() => {
    const next = query.trim() || null
    if (next === filters.query) return
    const timer = setTimeout(() => onChange({ query: next }, { replace: true }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, filters.query, onChange])

  return (
    <div className={cn('flex flex-col gap-(--space-8) lg:flex-row lg:items-center', className)}>
      <form role="search" onSubmit={(event) => event.preventDefault()} className="lg:w-64">
        <SearchField
          label="Buscar pelo nome de quem vai ser atendido"
          placeholder="Buscar pelo nome"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="py-(--space-8)"
        />
      </form>

      <div className="scrollbar-none -mx-(--space-16) flex items-center gap-(--space-8) overflow-x-auto px-(--space-16) lg:mx-0 lg:px-0">
        {showProfessionalFilter && (
          <FilterMenu
            label="Profissional"
            value={filters.professionalId}
            options={professionals.map(({ id, name }) => ({ value: id, label: name }))}
            onValueChange={(professionalId) => onChange({ professionalId })}
          />
        )}
        <FilterMenu
          label="Status"
          value={filters.status}
          options={AGENDA_STATUSES}
          onValueChange={(status) =>
            onChange({
              status: AGENDA_STATUSES.find(({ value }) => value === status)?.value ?? null,
            })
          }
        />
        <FilterMenu
          label="Serviço"
          value={filters.serviceId}
          options={services.map(({ id, name }) => ({ value: id, label: name }))}
          onValueChange={(serviceId) => onChange({ serviceId })}
        />
        {hasAgendaFilters(filters) && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              onChange({ professionalId: null, status: null, serviceId: null, query: null })
            }}
            className="type-label flex min-h-(--size-touch-min) shrink-0 items-center gap-(--space-4) rounded-md px-(--space-8) text-(--text-link) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <CloseIcon aria-hidden="true" className="size-4" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
