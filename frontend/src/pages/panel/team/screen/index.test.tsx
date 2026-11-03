import type { TeamData, TeamMember, TeamScreenProps } from './types'
import { describe, expect, it } from 'vitest'
import { draftOf, listCaption, optional, roleLabel, servicesLabel, subtitleOf } from './consts'

import { TeamScreen } from '.'
import { renderToString } from 'react-dom/server'

const member = (fields: Partial<TeamMember>): TeamMember => ({
  id: 'p1',
  displayName: 'Marina Souza',
  specialty: 'Cabeleireira',
  bio: null,
  isActive: true,
  isPubliclyVisible: false,
  hasPublicProfileConsent: false,
  hasAccount: false,
  serviceIds: ['s1'],
  workSummary: null,
  ...fields,
})

const services = [
  { id: 's1', name: 'Corte', isActive: true },
  { id: 's2', name: 'Barba', isActive: true },
]

const ready = (members: TeamMember[]): TeamData => ({ status: 'ready', members, services })

const render = (overrides: Partial<TeamScreenProps> = {}) =>
  renderToString(
    <TeamScreen
      data={ready([
        member({ id: 'p2', displayName: 'Carla Nunes', isActive: false, serviceIds: [] }),
        member({ isPubliclyVisible: true, hasPublicProfileConsent: true }),
      ])}
      businessName="Estúdio Duartina"
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('TeamScreen', () => {
  it('lista a equipe com os ativos primeiro e abre a ficha do primeiro', () => {
    const html = render()

    expect(html).toContain('1 na equipe · 1 inativo · Estúdio Duartina')
    expect(html.indexOf('Marina Souza')).toBeLessThan(html.indexOf('Carla Nunes'))
    expect(html).toContain('Cabeleireira · 1 serviço')
    expect(html).toContain('sem jornada')
    expect(html).toContain('Inativo')
    expect(html).toContain('Novo profissional')
    // a ficha é a do primeiro (Marina): perfil público, controles e a saída da equipe
    expect(html).toContain('Editar nome')
    expect(html).toContain('Perfil completo visível')
    expect(html).toContain('Ligado')
    expect(html).toContain('Consentimento dado pelo próprio profissional')
    expect(html).toContain('Jornada e bloqueios')
    expect(html).toContain('Remover da equipe')
    expect(html).not.toContain('Voltar para a equipe')
  })

  it('mostra a jornada quando ela existe, sem o aviso de sem jornada', () => {
    const html = render({
      data: ready([member({ workSummary: 'Seg a sáb · 09:00–18:00' })]),
    })

    expect(html).toContain('Seg a sáb · 09:00–18:00')
    expect(html).not.toContain('sem jornada')
  })

  it('quem está fora da equipe pode voltar', () => {
    const html = render({ data: ready([member({ isActive: false })]) })

    expect(html).toContain('Voltar para a equipe')
    expect(html).not.toContain('>Remover da equipe<')
  })

  it('sem profissional, convida a cadastrar', () => {
    expect(render({ data: ready([]) })).toContain('Cadastrar o primeiro profissional')
  })

  it('mostra o carregando e o erro com "Tentar de novo"', () => {
    expect(render({ data: { status: 'loading' } })).toContain('Carregando a equipe…')

    const html = render({
      data: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })
    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
  })
})

describe('equipe do painel', () => {
  it('resume a linha da lista e o subtítulo', () => {
    expect(listCaption(member({ serviceIds: ['s1', 's2'] }), services)).toBe(
      'Cabeleireira · 2 serviços',
    )
    expect(listCaption(member({ specialty: null, serviceIds: [] }), services)).toBe(
      'Profissional · 0 serviços',
    )
    expect(subtitleOf([member({})], 'Estúdio')).toBe('1 na equipe · Estúdio')
  })

  it('diz o papel conforme o profissional tenha login', () => {
    expect(roleLabel(member({ hasAccount: true }))).toContain('não edita serviço')
    expect(roleLabel(member({ hasAccount: false }))).toContain('Sem login')
  })

  it('lista os serviços pelo nome, em ordem', () => {
    expect(servicesLabel(member({ serviceIds: ['s2', 's1'] }), services)).toBe('Barba, Corte')
  })

  it('edita a partir do que a API devolveu e grava vazio como nulo', () => {
    expect(draftOf(member({ isPubliclyVisible: true }))).toEqual({
      displayName: 'Marina Souza',
      specialty: 'Cabeleireira',
      bio: null,
      isActive: true,
      showFullProfile: true,
      serviceIds: ['s1'],
    })
    expect(optional('   ')).toBeNull()
    expect(optional(' Barbeiro ')).toBe('Barbeiro')
  })
})
