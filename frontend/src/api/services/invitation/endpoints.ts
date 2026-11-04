/**
 * Rotas do link do convite (ADR-029). O token vai no corpo, nunca na URL: não cai em log de acesso nem em histórico.
 * A prévia e o aceite com conta nova são anônimos; o aceite de quem já tem conta exige login.
 */
export const invitationEndpoints = {
  preview: '/api/invitations/preview',
  accept: '/api/invitations/accept',
  acceptNewAccount: '/api/invitations/accept-new-account',
}
