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
