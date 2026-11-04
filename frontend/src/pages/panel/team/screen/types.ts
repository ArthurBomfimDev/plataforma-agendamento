import type { ImageSet } from '@api/models'

/** Um profissional na tela de equipe, já com os serviços que executa. */
export type TeamMember = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  isActive: boolean
  /** O dono já declarou ter a autorização desta pessoa para exibir os dados dela (só vale sem login). */
  authorizationDeclared: boolean
  /** Tem login (vínculo com uma conta). Sem login, o dono cadastrou e opera por ele. */
  hasAccount: boolean
  serviceIds: string[]
  /** Jornada em uma linha ("Seg a sáb · 09:00–18:00"). Nula: sem jornada, sem horário para agendar. */
  workSummary: string | null
  /** Foto enviada em Fotos (7CF). Nula: as iniciais. */
  photo?: ImageSet | null
}

export type TeamService = { id: string; name: string; isActive: boolean }

export type TeamData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; members: TeamMember[]; services: TeamService[] }

/** O que o dono edita de um profissional. */
export type TeamMemberDraft = {
  displayName: string
  specialty: string | null
  bio: string | null
  isActive: boolean
  /** O checkbox "Declaro ter autorização desta pessoa para exibir estes dados publicamente." */
  authorizationDeclared: boolean
  serviceIds: string[]
}

export type NewTeamMemberDraft = {
  displayName: string
  specialty: string | null
  bio: string | null
  /** O dono também atende: o profissional fica ligado à conta dele. */
  isMe: boolean
}

export type TeamScreenProps = {
  data: TeamData
  businessName: string
  /** Abre a tela de jornadas e bloqueios. */
  onOpenSchedules?: () => void
  /** Gravam na API. Resolvem `null` se deu certo, senão a mensagem de erro, já em português. */
  onCreate?: (draft: NewTeamMemberDraft) => Promise<string | null>
  onSave?: (member: TeamMember, draft: TeamMemberDraft) => Promise<string | null>
}
