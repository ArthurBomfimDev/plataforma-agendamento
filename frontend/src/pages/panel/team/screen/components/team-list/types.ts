import type { TeamMember, TeamService } from '../../types'

export type TeamListProps = {
  members: TeamMember[]
  services: TeamService[]
  selectedId: string | undefined
  onSelect: (memberId: string) => void
  /** Abre o cadastro de um profissional novo. */
  /** Abre o convite: é o único caminho para outra pessoa entrar. */
  onNew: () => void
  /** O dono cria o próprio perfil, quando também atende. */
  onSelf: () => void
}
