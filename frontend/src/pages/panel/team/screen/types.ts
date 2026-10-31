import type { ImageSet } from '@api/models'

/** Um profissional na tela de equipe, já com os serviços que executa. */
export type TeamMember = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  isActive: boolean
  /** Perfil completo na vitrine (especialidade, bio, foto). */
  isPubliclyVisible: boolean
  /** Dado pelo próprio profissional, nunca pelo dono. Sem ele, a vitrine mostra só o nome. */
  hasPublicProfileConsent: boolean
  /** Tem login (vínculo com uma conta). Sem login, o dono cadastrou e opera por ele. */
  hasAccount: boolean
  serviceIds: string[]
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
  showFullProfile: boolean
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
  /** Gravam na API. Resolvem `null` se deu certo, senão a mensagem de erro, já em português. */
  onCreate?: (draft: NewTeamMemberDraft) => Promise<string | null>
  onSave?: (member: TeamMember, draft: TeamMemberDraft) => Promise<string | null>
}
