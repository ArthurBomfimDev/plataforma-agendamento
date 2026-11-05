import type { TeamData, TeamMember, TeamScreenProps } from './types'
import { describe, expect, it } from 'vitest'
import {
  DECLARATION_TEXT,
  draftOf,
  isValidEmail,
  listCaption,
  needsDeclaration,
  optional,
  publicBasisLabel,
  roleLabel,
  seatsFull,
  seatsLabel,
  servicesLabel,
  subtitleOf,
} from './consts'

import { TeamScreen } from '.'
import { renderToString } from 'react-dom/server'

const member = (fields: Partial<TeamMember>): TeamMember => ({
  id: 'p1',
  displayName: 'Marina Souza',
  specialty: 'Cabeleireira',
  bio: null,
  isActive: true,
  authorizationDeclared: false,
  registration: null,
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
        member({ authorizationDeclared: true }),
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
    expect(html).toContain('Perfil público')
    expect(html).toContain('Visível')
    expect(html).toContain('Declaração do dono registrada')
    expect(html).not.toContain('consentimento')
    expect(html).not.toContain('Perfil completo')
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

const invite = {
  id: 'i1',
  name: 'Ana Souza',
  email: 'ana@example.com',
  roleLabel: 'Atendente',
  validUntil: '11/11/2026',
}

describe('TeamScreen — foto do profissional', () => {
  const photo = {
    onUpload: () => async () => null,
    onRemove: () => async () => undefined,
  }

  it('a ficha traz o envio de foto, com as funções da aba Fotos', () => {
    const html = render({ data: ready([member({ hasAccount: true })]), photo })

    expect(html).toContain('id="team-photo-detail-')
    expect(html).toContain('Sem foto, aparecem as iniciais')
  })

  it('sem login e sem declaração, avisa o que falta antes de enviar', () => {
    const html = render({
      data: ready([member({ hasAccount: false, authorizationDeclared: false })]),
      photo,
    })

    expect(html).toContain('marque antes a declaração de autorização em Editar')
  })

  it('com foto, mostra a imagem atual', () => {
    const image = { small: 'p/k-s.webp', medium: 'p/k-m.webp', large: 'p/k-l.webp' }
    const html = render({
      data: ready([member({ hasAccount: true, photo: image })]),
      photo,
    })

    expect(html).toContain('Aparece na página pública')
    expect(html).toMatch(/<img[^>]*p\/k-/)
  })

  it('sem as funções, a ficha não mostra o campo', () => {
    expect(render({ data: ready([member({})]) })).not.toContain('team-photo-detail')
  })
})

describe('TeamScreen — convites (ADR-029)', () => {
  it('sem a prop de convites, a tela não mostra a seção', () => {
    expect(render()).not.toContain('Convites')
  })

  it('carregando: avisa que está carregando os convites', () => {
    const html = render({ invites: { status: 'loading' } })

    expect(html).toContain('Convites')
    expect(html).toContain('Carregando os convites')
  })

  it('erro: mostra a mensagem e "Tentar de novo"', () => {
    const html = render({
      invites: {
        status: 'error',
        message: 'Sem conexão com o servidor.',
        onRetry: () => undefined,
      },
    })

    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
  })

  it('vazio: explica o convite e deixa convidar', () => {
    const html = render({
      invites: { status: 'ready', invites: [], seats: { used: 2, limit: 15 } },
    })

    expect(html).toContain('Nenhum convite pendente')
    expect(html).toContain('2 de 15 vagas ocupadas')
    expect(html).toMatch(/<button[^>]*>Convidar<\/button>/)
    expect(html).not.toContain('A equipe está completa')
  })

  it('sucesso: lista o pendente com o papel, o e-mail, a validade e as ações', () => {
    const html = render({
      invites: { status: 'ready', invites: [invite], seats: { used: 3, limit: 15 } },
    })

    expect(html).toContain('Ana Souza · Atendente')
    expect(html).toContain('ana@example.com · vale até 11/11/2026')
    expect(html).toContain('Reenviar')
    expect(html).toContain('Revogar')
    expect(html).toContain('3 de 15 vagas ocupadas')
  })

  it('equipe completa: desliga o convite e explica', () => {
    const html = render({
      invites: { status: 'ready', invites: [invite], seats: { used: 15, limit: 15 } },
    })

    expect(html).toContain('A equipe está completa')
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Convidar<\/button>/)
  })

  it('as vagas que ainda não chegaram não escondem a lista', () => {
    const html = render({ invites: { status: 'ready', invites: [invite], seats: null } })

    expect(html).toContain('Ana Souza · Atendente')
    expect(html).not.toContain('vagas ocupadas')
  })
})

describe('convites e registro: regras da tela', () => {
  it('valida o e-mail só no formato, quem decide é o servidor', () => {
    expect(isValidEmail('ana@example.com')).toBe(true)
    expect(isValidEmail(' ana@example.com ')).toBe(true)
    expect(isValidEmail('ana@example')).toBe(false)
    expect(isValidEmail('ana example.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('conta as vagas no singular e no plural e sabe quando está cheio', () => {
    expect(seatsLabel({ used: 1, limit: 1 })).toBe('1 de 1 vaga ocupada')
    expect(seatsLabel({ used: 3, limit: 15 })).toBe('3 de 15 vagas ocupadas')
    expect(seatsFull({ used: 15, limit: 15 })).toBe(true)
    expect(seatsFull({ used: 14, limit: 15 })).toBe(false)
    expect(seatsFull(null)).toBe(false)
  })

  it('o rascunho de edição leva o registro profissional', () => {
    expect(draftOf(member({ registration: 'CRP 06/123456' })).registration).toBe('CRP 06/123456')
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

  it('diz em que base o perfil é público: declaração do dono ou o próprio profissional', () => {
    expect(publicBasisLabel(member({ hasAccount: true }))).toContain('do próprio profissional')
    expect(publicBasisLabel(member({ authorizationDeclared: true }))).toContain(
      'Declaração do dono registrada',
    )
    expect(publicBasisLabel(member({ authorizationDeclared: false }))).toContain(
      'Sem declaração do dono',
    )
  })

  it('só exige a declaração de quem não tem login e tem apresentação a salvar', () => {
    expect(needsDeclaration({ hasAccount: false }, 'Cortes há 10 anos.')).toBe(true)
    expect(needsDeclaration({ hasAccount: false }, '   ')).toBe(false)
    expect(needsDeclaration({ hasAccount: false }, null)).toBe(false)
    expect(needsDeclaration({ hasAccount: true }, 'Cortes há 10 anos.')).toBe(false)
  })

  it('o texto do checkbox é o da declaração do dono', () => {
    expect(DECLARATION_TEXT).toBe(
      'Declaro ter autorização desta pessoa para exibir estes dados publicamente.',
    )
  })

  it('lista os serviços pelo nome, em ordem', () => {
    expect(servicesLabel(member({ serviceIds: ['s2', 's1'] }), services)).toBe('Barba, Corte')
  })

  it('edita a partir do que a API devolveu e grava vazio como nulo', () => {
    expect(draftOf(member({ authorizationDeclared: true }))).toEqual({
      displayName: 'Marina Souza',
      specialty: 'Cabeleireira',
      bio: null,
      isActive: true,
      authorizationDeclared: true,
      registration: null,
      serviceIds: ['s1'],
    })
    expect(optional('   ')).toBeNull()
    expect(optional(' Barbeiro ')).toBe('Barbeiro')
  })
})
