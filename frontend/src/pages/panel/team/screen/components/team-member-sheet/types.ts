import type { TeamMember, TeamMemberDraft, TeamService } from '../../types'

export type TeamMemberSheetProps = {
  /** Nulo: fechada. */
  member: TeamMember | null
  services: TeamService[]
  /** Mostra "Registro profissional (opcional)": só em Saúde. */
  showRegistration?: boolean
  onOpenChange: (open: boolean) => void
  /** Resolve `null` se gravou, senão a mensagem de erro. */
  onSave: (draft: TeamMemberDraft) => Promise<string | null>
}
