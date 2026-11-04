import { describe, expect, it } from 'vitest'

import { ProfileScreen } from '.'
import type { ProfileScreenProps } from './types'
import { renderToString } from 'react-dom/server'

const profile = {
  id: 'p1',
  displayName: 'Marcos Lima',
  specialty: 'Barbeiro',
  bio: 'Cortes há 10 anos.',
  registration: null,
  photo: null,
}

const render = (overrides: Partial<ProfileScreenProps> = {}) =>
  renderToString(
    <ProfileScreen
      data={{ status: 'ready', profile }}
      businessName="Estúdio Duartina"
      showRegistration={false}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('ProfileScreen', () => {
  it('carregando: avisa e não mostra o formulário', () => {
    const html = render({ data: { status: 'loading' } })

    expect(html).toContain('Carregando seu perfil')
    expect(html).not.toContain('Salvar')
  })

  it('erro: mostra a mensagem e "Tentar de novo"', () => {
    const html = render({
      data: { status: 'error', message: 'Você não tem permissão.', onRetry: () => undefined },
    })

    expect(html).toContain('Você não tem permissão.')
    expect(html).toContain('Tentar de novo')
  })

  it('vazio: perfil sem especialidade, bio e foto abre o formulário em branco e a foto sem imagem', () => {
    const html = render({
      data: { status: 'ready', profile: { ...profile, specialty: null, bio: null } },
    })

    expect(html).toContain('for="my-profile-specialty"')
    expect(html).toContain('for="my-profile-bio"')
    expect(html).toContain('sem foto')
    expect(html).not.toContain('Cortes há 10 anos.')
  })

  it('sucesso: nome fixo, campos preenchidos, foto e aviso de dado público', () => {
    const html = render()

    expect(html).toContain('Meu perfil')
    expect(html).toContain('Marcos Lima')
    expect(html).toContain('definidos pelo estabelecimento')
    expect(html).toContain('Barbeiro')
    expect(html).toContain('Cortes há 10 anos.')
    expect(html).toContain('Foto')
    expect(html).toContain('Não escreva dados de saúde')
    expect(html).toContain('Salvar')
  })

  it('o registro profissional só aparece em Saúde', () => {
    expect(render()).not.toContain('Registro profissional')

    const html = render({ showRegistration: true })

    expect(html).toContain('for="my-profile-registration"')
    expect(html).toContain('Registro profissional (opcional)')
  })

  it('sair do estabelecimento só aparece quando a tela recebe o tratamento', () => {
    expect(render()).not.toContain('Sair do estabelecimento')
    expect(render({ onLeave: async () => null })).toContain(
      'Você deixa a equipe de Estúdio Duartina',
    )
  })

  it('respeita os limites do domínio nos campos', () => {
    const html = render({ showRegistration: true })

    expect(html).toContain('maxLength="1000"')
    expect(html).toContain('maxLength="100"')
    expect(html).toContain('maxLength="40"')
  })
})
