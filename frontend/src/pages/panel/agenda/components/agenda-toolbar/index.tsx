import { AGENDA_STATUSES, AGENDA_VIEWS, hasAgendaFilters } from '@pages/panel/agenda/filters'

import type { AgendaToolbarProps } from './types'
import { Button } from '@components/button'
import { SegmentedControl } from '@components/segmented-control'
import { SelectField } from '@components/select-field'
import { TextField } from '@components/text-field'
import { useState } from 'react'

const ALL = ''

/**
 * Barra da agenda (Onda 7CF): Dia, Semana ou Mês, e os filtros por profissional, status, serviço e nome de quem vai
 * ser atendido. Tudo vai para a URL pela rota: o link, o voltar e o recarregar guardam o recorte.
 *
 * O profissional não vê o filtro de profissional: a API já devolve só a agenda dele.
 */
export const AgendaToolbar = (props: AgendaToolbarProps) => {
  const { filters, professionals, services, showProfessionalFilter, onChange } = props
  const [query, setQuery] = useState(filters.query ?? '')
  const [urlQuery, setUrlQuery] = useState(filters.query)

  // A URL manda (voltar no histórico, limpar): o campo acompanha, ajustado na renderização.
  if (filters.query !== urlQuery) {
    setUrlQuery(filters.query)
    setQuery(filters.query ?? '')
  }

  return (
    <div className="flex flex-col gap-(--space-12)">
      <SegmentedControl
        label="Visualização da agenda"
        options={AGENDA_VIEWS}
        value={filters.view}
        onValueChange={(view) => onChange({ view })}
        className="self-start"
      />
      <div className="grid gap-(--space-12) sm:grid-cols-2 xl:grid-cols-4">
        {showProfessionalFilter && (
          <SelectField
            id="agenda-professional"
            label="Profissional"
            value={filters.professionalId ?? ALL}
            options={[
              { value: ALL, label: 'Todos' },
              ...professionals.map(({ id, name }) => ({ value: id, label: name })),
            ]}
            onChange={(event) => onChange({ professionalId: event.target.value || null })}
          />
        )}
        <SelectField
          id="agenda-status"
          label="Status"
          value={filters.status ?? ALL}
          options={[{ value: ALL, label: 'Todos' }, ...AGENDA_STATUSES]}
          onChange={(event) =>
            onChange({
              status:
                AGENDA_STATUSES.find(({ value }) => value === event.target.value)?.value ?? null,
            })
          }
        />
        <SelectField
          id="agenda-service"
          label="Serviço"
          value={filters.serviceId ?? ALL}
          options={[
            { value: ALL, label: 'Todos' },
            ...services.map(({ id, name }) => ({ value: id, label: name })),
          ]}
          onChange={(event) => onChange({ serviceId: event.target.value || null })}
        />
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            onChange({ query: query.trim() || null })
          }}
        >
          <TextField
            id="agenda-query"
            label="Nome de quem vai ser atendido"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => onChange({ query: query.trim() || null })}
          />
        </form>
      </div>
      {hasAgendaFilters(filters) && (
        <Button
          variant="ghost"
          className="self-start"
          onClick={() =>
            onChange({ professionalId: null, status: null, serviceId: null, query: null })
          }
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
