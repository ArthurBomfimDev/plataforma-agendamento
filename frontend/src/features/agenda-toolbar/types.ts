import type { AgendaFilters } from '@router/agenda-filters'

export type AgendaToolbarProps = {
  filters: AgendaFilters
  professionals: ReadonlyArray<{ id: string; name: string }>
  services: ReadonlyArray<{ id: string; name: string }>
  /** Só o dono escolhe profissional; o profissional vê a própria agenda. */
  showProfessionalFilter: boolean
  onChange: (patch: Partial<AgendaFilters>) => void
}
