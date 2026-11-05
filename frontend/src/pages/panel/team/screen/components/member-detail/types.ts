import type { TeamMember, TeamService } from '../../types'

export type MemberDetailProps = {
  member: TeamMember
  services: TeamService[]
  /** Salvando a situação: o botão fica desligado. */
  busy: boolean
  /** Só no celular e no tablet: volta da ficha para a lista da equipe. */
  onBack: () => void
  /** Abre a gaveta de edição (nome, perfil, serviços). */
  onEdit: () => void
  onOpenSchedules?: () => void
  /** Pede a confirmação de desativar. */
  onDeactivate: () => void
  onActivate: () => void
}
