const professional = (professionalId: string) =>
  `/api/professionals/${encodeURIComponent(professionalId)}`

export const professionalEndpoints = {
  /** Página pública (anônima). */
  page: professional,
  /** "Solicitar remoção deste perfil" (anônima, com limite de taxa). */
  removalRequest: (professionalId: string) => `${professional(professionalId)}/removal-requests`,
  /** "Sair do estabelecimento": profissional ou atendente com conta. */
  leave: '/api/businesses/current/leave',
  admin: {
    removals: '/api/admin/professional-removals',
    resolve: (requestId: string) =>
      `/api/admin/professional-removals/${encodeURIComponent(requestId)}/resolve`,
  },
}
