import type { TeamMember, TeamMemberDraft, TeamService } from './types'

/** Ativos primeiro, depois por nome. */
export const byActiveThenName = (a: TeamMember, b: TeamMember) =>
  Number(b.isActive) - Number(a.isActive) || a.displayName.localeCompare(b.displayName, 'pt-BR')

/** O que a vitrine mostra deste profissional, dito em palavras. */
export const visibilityLabel = (member: TeamMember) =>
  member.isPubliclyVisible
    ? 'Perfil completo na vitrine'
    : member.hasPublicProfileConsent
      ? 'Só o nome na vitrine'
      : 'Só o nome na vitrine (sem consentimento para o perfil completo)'

export const servicesLabel = (member: TeamMember, services: TeamService[]) => {
  const names = services
    .filter(({ id }) => member.serviceIds.includes(id))
    .map(({ name }) => name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return names.length > 0 ? names.join(', ') : 'Nenhum serviço: não aparece para agendar.'
}

export const draftOf = (member: TeamMember): TeamMemberDraft => ({
  displayName: member.displayName,
  specialty: member.specialty,
  bio: member.bio,
  isActive: member.isActive,
  showFullProfile: member.isPubliclyVisible,
  serviceIds: member.serviceIds,
})

/** Campo opcional vazio vai como `null`, como o domínio guarda. */
export const optional = (value: string) => value.trim() || null
