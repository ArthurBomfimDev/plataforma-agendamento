/** Papéis que um convite pode dar. O `Owner` nunca é convidável. */
export type InvitationRole = 'Professional' | 'Attendant'

/** `POST /api/invitations/preview` (anônimo): o que a tela do convite mostra antes de aceitar. */
export type InvitationPreviewResponse = {
  businessName: string
  inviterName: string
  inviteeName: string
  /** O e-mail do convite: a conta que aceita precisa ter este e-mail. */
  email: string
  role: InvitationRole
  /** Já existe conta com este e-mail: a pessoa entra em vez de criar. */
  accountExists: boolean
  termsVersion: string
  /** Só `Professional` aceita o termo. */
  termsRequired: boolean
}

/** `Pending` é o único estado que a lista do dono devolve (expirado, aceito e revogado saem dela). */
export type InvitationState = 'Pending' | 'Accepted' | 'Revoked' | 'Expired'

/** `POST /api/businesses/current/invitations` (só o dono). `professionalId`: liga o convite a um perfil já cadastrado. */
export type InviteMemberRequest = {
  name: string
  email: string
  role: InvitationRole
  professionalId?: string | null
  /** Até 80 caracteres: a especialidade do perfil que nasce no aceite. A API a descarta para `Attendant`. */
  specialty?: string | null
}

export type InvitationResponse = {
  id: string
  name: string
  email: string
  role: InvitationRole
  professionalId: string | null
  state: InvitationState
  expiresAt: string
  lastSentAt: string
  /** Só em convite de profissional; nulo em convites antigos. */
  specialty?: string | null
}

/** Vagas da equipe: contas ativas + convites pendentes contra o limite do estabelecimento. */
export type SeatsResponse = { used: number; limit: number }

/** Um membro com conta: a seção Equipe. `role` é o papel de acesso, não o perfil público. */
export type TeamMemberResponse = {
  membershipId: string
  name: string
  role: 'Owner' | 'Professional' | 'Attendant'
}

export type AcceptInvitationNewAccountRequest = {
  token: string
  fullName: string
  password: string
  acceptTerms: boolean
}

export type AcceptedInvitationResponse = {
  businessId: string
  businessName: string
  role: InvitationRole
}
