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
  authorizationDeclared: member.authorizationDeclared,
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

/** O texto do checkbox do dono (ADR-031). Mudou o texto, muda a versão em `Professional.AuthorizationDeclarationTextVersion`. */
export const DECLARATION_TEXT =
  'Declaro ter autorização desta pessoa para exibir estes dados publicamente.'

export const DECLARATION_REQUIRED_MESSAGE = 'Marque a declaração para salvar a apresentação.'

/** Quem aparece na vitrine e com que base: declaração do dono (sem login) ou o próprio profissional (com login). */
export const publicBasisLabel = (member: TeamMember) =>
  member.hasAccount
    ? 'Os dados públicos são do próprio profissional, que os edita pela conta dele.'
    : member.authorizationDeclared
      ? 'Declaração do dono registrada: você tem a autorização desta pessoa.'
      : 'Sem declaração do dono. Para salvar a apresentação, marque a declaração em Editar.'

/** A apresentação de quem não tem login precisa da declaração do dono para ser salva. */
export const needsDeclaration = (member: Pick<TeamMember, 'hasAccount'>, bio: string | null) =>
  !member.hasAccount && Boolean(bio?.trim())

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
