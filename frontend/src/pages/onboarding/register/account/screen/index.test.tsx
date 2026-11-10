import { describe, expect, it } from 'vitest'

import { OwnerAccountScreen } from '.'
import type { OwnerAccountScreenProps } from './types'
import { renderToString } from 'react-dom/server'
import { validateOwnerAccount } from './consts'

const render = (props: OwnerAccountScreenProps = {}) =>
  renderToString(<OwnerAccountScreen {...props} />).replaceAll('<!-- -->', '')

const VALID = { fullName: 'Ana Souza', email: 'ana@exemplo.com', password: 'senha-de-teste' }

describe('OwnerAccountScreen (sucesso: o formulário completo)', () => {
  it('é o primeiro passo, com nome, e-mail, senha, termos e a saída para quem já tem conta', () => {
    const html = render()

    expect(html).toContain('Primeiro passo · Sua conta')
    expect(html).toContain('Cadastrar meu estabelecimento')
    expect(html).toContain('id="owner-account-name"')
    expect(html).toContain('id="owner-account-email"')
    expect(html).toContain('id="owner-account-password"')
    expect(html).toContain('Li e aceito os Termos de Uso e a Política de Privacidade.')
    expect(html).toContain('Criar conta e continuar')
    expect(html).toContain('Já tenho conta:')
  })

  it('não pede a data de nascimento: o perfil de consumidor é completado depois', () => {
    expect(render()).not.toMatch(/nascimento/i)
  })

  it('tem o alternador de tema, para quem prefere o escuro desde o primeiro passo', () => {
    expect(render()).toContain('aria-label="Tema escuro"')
  })

  it('diz "consumidor" e "estabelecimento", nunca "cliente"', () => {
    const html = render()

    expect(html).toContain('consumidor')
    expect(html).toContain('estabelecimento')
    expect(html).not.toMatch(/cliente/i)
  })
})

describe('OwnerAccountScreen (carregando e erro)', () => {
  it('enquanto cria a conta, o botão fica desligado e diz o que faz', () => {
    const html = render({ submitting: true })

    expect(html).toContain('Criando conta…')
    expect(html).toMatch(/disabled=""[^>]*>Criando conta…/)
  })

  it('mostra o erro da tentativa em um alerta', () => {
    const html = render({ error: 'Já existe uma conta com este e-mail.' })

    expect(html).toMatch(/role="alert"[^>]*>Já existe uma conta com este e-mail\./)
  })

  it('sem erro, não há alerta', () => {
    expect(render()).not.toContain('role="alert"')
  })
})

describe('validateOwnerAccount (vazio)', () => {
  it('formulário vazio: um erro por campo, em palavras claras', () => {
    expect(validateOwnerAccount({ fullName: '', email: '', password: '' }, false)).toEqual({
      fullName: 'Informe seu nome completo',
      email: 'Informe um e-mail válido',
      password: 'A senha tem no mínimo 8 caracteres',
      terms: 'Aceite os termos para continuar',
    })
  })

  it('dados válidos e termos aceitos: nenhum erro', () => {
    expect(validateOwnerAccount(VALID, true)).toEqual({})
  })

  it('sem aceitar os termos, só os termos reprovam', () => {
    expect(validateOwnerAccount(VALID, false)).toEqual({ terms: 'Aceite os termos para continuar' })
  })

  it('segue as regras de senha do cadastro comum: de 8 a 128 caracteres', () => {
    expect(validateOwnerAccount({ ...VALID, password: '1234567' }, true).password).toBeDefined()
    expect(validateOwnerAccount({ ...VALID, password: '12345678' }, true).password).toBeUndefined()
    expect(validateOwnerAccount({ ...VALID, password: 'a'.repeat(129) }, true).password).toBe(
      'A senha tem no máximo 128 caracteres',
    )
  })

  it('e-mail sem domínio é recusado', () => {
    expect(validateOwnerAccount({ ...VALID, email: 'ana@exemplo' }, true).email).toBeDefined()
  })
})
