import type { ImageSet } from '@api/models'
import type { MemberPhotoActions } from './components/member-photo'

/** Um profissional na tela de equipe, já com os serviços que executa. */
export type TeamMember = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  isActive: boolean
  /** O dono já declarou ter a autorização desta pessoa para exibir os dados dela (só vale sem login). */
  authorizationDeclared: boolean
  /** Registro profissional (Saúde), exibido na página pública. */
  registration: string | null
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
  registration: string | null
  serviceIds: string[]
}

export type NewTeamMemberDraft = {
  displayName: string
  specialty: string | null
  bio: string | null
  /** O dono também atende: o profissional fica ligado à conta dele. */
  isMe: boolean
}

/** Um convite pendente na lista do dono. */
export type PendingInvite = {
  id: string
  name: string
  email: string
  /** `Profissional` ou `Atendente`. */
  roleLabel: string
  /** Especialidade do convite de profissional; nula para o atendente e para convites antigos. */
  specialty: string | null
  /** "dd/MM/aaaa": quando o link deixa de valer. */
  validUntil: string
}

export type InviteDraft = {
  name: string
  email: string
  role: 'Professional' | 'Attendant'
  /** Perfil de profissional já cadastrado a ligar à conta; nulo: o perfil é criado quando a pessoa aceita. */
  professionalId: string | null
  /** Especialidade do perfil que nasce no aceite. Só para `Professional`; nula para o atendente. */
  specialty?: string | null
}

/** Convites pendentes e vagas da equipe (ADR-029). `seats` nulo: as vagas ainda não chegaram. */
export type InvitesData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; invites: PendingInvite[]; seats: { used: number; limit: number } | null }

export type TeamScreenProps = {
  /** Mostra o campo "Registro profissional": só em estabelecimento de Saúde. */
  showRegistration?: boolean
  /** Ausente: a tela não mostra convites (só o dono tem esta seção; o servidor recusa o resto com 403). */
  invites?: InvitesData
  /** Gravam na API. Resolvem `null` se deu certo, senão a mensagem de erro, já em português. */
  onInvite?: (draft: InviteDraft) => Promise<string | null>
  onResendInvite?: (inviteId: string) => Promise<string | null>
  onRevokeInvite?: (inviteId: string) => Promise<string | null>
  data: TeamData
  businessName: string
  /** Abre a tela de jornadas e bloqueios. */
  onOpenSchedules?: () => void
  /** Gravam na API. Resolvem `null` se deu certo, senão a mensagem de erro, já em português. */
  onCreate?: (draft: NewTeamMemberDraft) => Promise<string | null>
  onSave?: (member: TeamMember, draft: TeamMemberDraft) => Promise<string | null>
  /** Enviar e remover a foto: as mesmas funções da aba Fotos. */
  photo?: MemberPhotoActions
}
