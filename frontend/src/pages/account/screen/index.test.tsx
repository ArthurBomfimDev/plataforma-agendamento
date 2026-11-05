import { describe, expect, it } from 'vitest'

import { MyAccountScreen } from '.'
import type { MyAccountScreenProps } from './types'
import { renderToString } from 'react-dom/server'
import { validatePasswordChange } from './consts'

const render = (overrides: Partial<MyAccountScreenProps> = {}) =>
  renderToString(
    <MyAccountScreen
      data={{ status: 'ready', fullName: 'Ana Consumidora', email: 'consumidor@example.com' }}
      onSaveName={async () => null}
      onChangePassword={async () => null}
      onSignOut={() => undefined}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('MyAccountScreen — consentimentos', () => {
  const consent = {
    id: 'c1',
    purpose: 'SensitiveScheduling',
    version: '2026-10-v1',
    grantedAt: '2026-11-05T15:00:00Z',
    revokedAt: null,
  }

  it('sem a prop, a seção não aparece', () => {
    expect(render()).not.toContain('Consentimentos')
  })

  it('carregando, erro e vazio', () => {
    expect(render({ consents: { status: 'loading' } })).toContain('Carregando os consentimentos')
    expect(
      render({ consents: { status: 'error', message: 'Sem conexão.', onRetry: () => undefined } }),
    ).toContain('Sem conexão.')
    expect(render({ consents: { status: 'ready', items: [] } })).toContain(
      'Você ainda não deu nenhum consentimento',
    )
  })

  it('em vigor: mostra a finalidade, a versão e oferece revogar', () => {
    const html = render({ consents: { status: 'ready', items: [consent] } })

    expect(html).toContain('Agendar em estabelecimentos de saúde')
    expect(html).toContain('Em vigor desde 05/11/2026')
    expect(html).toContain('versão 2026-10-v1')
    expect(html).toMatch(/<button[^>]*>Revogar<\/button>/)
  })

  it('revogado: diz quando e não oferece revogar de novo', () => {
    const html = render({
      consents: {
        status: 'ready',
        items: [{ ...consent, revokedAt: '2026-11-06T15:00:00Z' }],
      },
    })

    expect(html).toContain('Revogado em 06/11/2026')
    expect(html).not.toMatch(/<button[^>]*>Revogar<\/button>/)
  })
})

describe('MyAccountScreen', () => {
  it('mostra o nome para editar, o e-mail só para ver, a troca de senha e o sair', () => {
    const html = render()

    expect(html).toContain('Minha conta')
    expect(html).toMatch(/id="account-name"[^>]*value="Ana Consumidora"/)
    expect(html).toContain('consumidor@example.com')
    expect(html).not.toMatch(/<input[^>]*value="consumidor@example.com"/)
    expect(html).toContain('Trocar o e-mail ainda não é possível pelo app.')
    expect(html).toContain('Senha atual')
    expect(html).toContain('autoComplete="current-password"')
    expect(html).toContain('Sair')
    // Nome igual ao salvo: nada a salvar.
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""[^>]*>Salvar nome/)
  })

  it('oferece o tema escuro e "Meu painel" só para quem tem estabelecimento', () => {
    const without = render()
    expect(without).toContain('Tema escuro')
    expect(without).toContain('aria-label="Tema escuro"')
    expect(without).not.toContain('Meu painel')

    expect(render({ onOpenPanel: () => undefined })).toContain('Meu painel')
  })

  it('oferece "Cadastrar meu estabelecimento" quando a ação é passada', () => {
    expect(render()).not.toContain('Cadastrar meu estabelecimento')
    expect(render({ onRegisterBusiness: () => undefined })).toContain(
      'Cadastrar meu estabelecimento',
    )
  })

  it('"Sair" só pede confirmação quando tocado: o diálogo começa fechado', () => {
    const html = render()

    expect(html).toContain('Sair')
    expect(html).not.toContain('Sair da conta?')
  })

  it('"Trocar de contexto" só com mais de um contexto', () => {
    expect(render()).not.toContain('Trocar de contexto')
    expect(render({ onSwitchContext: () => undefined })).toContain('Trocar de contexto')
  })

  it('mostra o carregando e o erro com "Tentar de novo"', () => {
    expect(render({ data: { status: 'loading' } })).toContain('Carregando a conta…')
    const html = render({
      data: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })
    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
  })
})

describe('troca de senha', () => {
  it('confere no cliente a mesma regra de tamanho do backend e a confirmação', () => {
    expect(validatePasswordChange('atual-123', 'nova-senha-456', 'nova-senha-456')).toEqual({})
    expect(validatePasswordChange('', 'curta', 'outra')).toEqual({
      current: 'Informe a senha atual.',
      next: 'A senha nova precisa ter entre 8 e 128 caracteres.',
      confirm: 'As duas senhas novas não são iguais.',
    })
    expect(validatePasswordChange('mesma-senha-1', 'mesma-senha-1', 'mesma-senha-1').next).toBe(
      'A senha nova precisa ser diferente da atual.',
    )
  })
})
