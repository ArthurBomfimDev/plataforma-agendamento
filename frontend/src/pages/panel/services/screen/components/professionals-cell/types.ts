import type { ServiceListItem } from '../../types'

export type ProfessionalsCellProps = {
  professionals: ServiceListItem['professionals']
  /** Abre o cadastro do serviço, onde os profissionais são escolhidos. */
  onAssign?: () => void
}
