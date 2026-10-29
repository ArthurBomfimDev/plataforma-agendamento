import type { TeamData, TeamMember, TeamScreenProps } from './types'
import { describe, expect, it } from 'vitest'
import { draftOf, optional, servicesLabel, visibilityLabel } from './consts'

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
  it('lista a equipe com os ativos primeiro, a situação em texto e os serviços', () => {
    const html = render()

    expect(html).toContain('1 ativo de 2 · Estúdio Duartina')
    expect(html.indexOf('Marina Souza')).toBeLessThan(html.indexOf('Carla Nunes'))
    expect(html).toContain('Cabeleireira')
    expect(html).toContain('Perfil completo na vitrine')
    expect(html).toContain('Nenhum serviço: não aparece para agendar.')
    expect(html).toContain('aria-label="Desativar Marina Souza"')
    expect(html).toContain('aria-label="Ativar Carla Nunes"')
    expect(html).toContain('Novo profissional')
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
  it('diz o que a vitrine mostra, conforme o consentimento', () => {
    expect(visibilityLabel(member({ isPubliclyVisible: true }))).toBe('Perfil completo na vitrine')
    expect(visibilityLabel(member({ hasPublicProfileConsent: true }))).toBe('Só o nome na vitrine')
    expect(visibilityLabel(member({}))).toContain('sem consentimento')
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
