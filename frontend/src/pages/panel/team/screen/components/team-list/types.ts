import type { TeamMember, TeamService } from '../../types'

export type TeamListProps = {
  members: TeamMember[]
  services: TeamService[]
  selectedId: string | undefined
  onSelect: (memberId: string) => void
  /** Abre o cadastro de um profissional novo. */
  onNew: () => void
}
