import type { TeamMember, TeamMemberDraft, TeamService } from './types'

/** Ativos primeiro, depois por nome. */
export const byActiveThenName = (a: TeamMember, b: TeamMember) =>
  Number(b.isActive) - Number(a.isActive) || a.displayName.localeCompare(b.displayName, 'pt-BR')

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

/** Título pequeno de seção (o "overline" do Figma): caixa alta e entreletras aberto. */
export const OVERLINE = 'type-caption font-medium tracking-[0.8px] text-(--text-muted) uppercase'

const servicesOf = (member: TeamMember, services: TeamService[]) =>
  services.filter(({ id }) => member.serviceIds.includes(id))

/** Linha de baixo do item da lista: "Cabeleireira · 4 serviços". */
export const listCaption = (member: TeamMember, services: TeamService[]) => {
  const count = servicesOf(member, services).length
  return `${member.specialty ?? 'Profissional'} · ${count} ${count === 1 ? 'serviço' : 'serviços'}`
}

export const workLabel = (member: TeamMember) =>
  member.workSummary ?? 'Sem jornada: não tem horário para agendar.'

export const consentLabel = (member: TeamMember) =>
  member.hasPublicProfileConsent
    ? 'Consentimento dado pelo próprio profissional'
    : 'Sem consentimento do próprio profissional'

export const roleLabel = (member: TeamMember) =>
  member.hasAccount
    ? 'Profissional — não edita serviço, jornada nem equipe'
    : 'Sem login — você opera a agenda por ele'

export const subtitleOf = (members: TeamMember[], businessName: string) => {
  const active = members.filter(({ isActive }) => isActive).length
  const inactive = members.length - active
  return [
    `${active} na equipe`,
    ...(inactive > 0 ? [`${inactive} ${inactive === 1 ? 'inativo' : 'inativos'}`] : []),
    businessName,
  ].join(' · ')
}
