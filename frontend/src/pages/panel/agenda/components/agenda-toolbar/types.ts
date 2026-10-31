import type { AgendaFilters } from '@pages/panel/agenda/filters'

export type AgendaToolbarProps = {
  filters: AgendaFilters
  professionals: ReadonlyArray<{ id: string; name: string }>
  services: ReadonlyArray<{ id: string; name: string }>
  /** Só o dono escolhe profissional; o profissional vê a própria agenda. */
  showProfessionalFilter: boolean
  /** `replace`: troca a entrada do histórico em vez de criar outra (a busca, a cada letra). */
  onChange: (patch: Partial<AgendaFilters>, options?: { replace?: boolean }) => void
  className?: string
}
