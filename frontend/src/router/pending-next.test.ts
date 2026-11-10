import { NEXT_TTL_MS, clearNext, readNext, rememberNext } from './pending-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES, businessEntryPath, safeNext, signInPath } from './paths'

const storage = () => {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

describe('safeNext: lista fechada de destinos internos', () => {
  it('aceita o assistente, o convite com token e as telas da lista', () => {
    expect(safeNext('/cadastrar-estabelecimento')).toBe('/cadastrar-estabelecimento')
    expect(safeNext('/cadastrar-estabelecimento?retomar=1')).toBe(
      '/cadastrar-estabelecimento?retomar=1',
    )
    expect(safeNext('/convite?token=abc')).toBe('/convite?token=abc')
    expect(safeNext('/appointments')).toBe('/appointments')
    expect(safeNext('/para-estabelecimentos')).toBe('/para-estabelecimentos')
  })

  it('ignora destino externo, protocolo, barra dupla e contrabarra', () => {
    for (const value of [
      'https://site.mal/cadastrar-estabelecimento',
      '//site.mal/cadastrar-estabelecimento',
      '//site.mal',
      'javascript:alert(1)',
      '/\\site.mal',
      'cadastrar-estabelecimento',
      'http://localhost/appointments',
    ]) {
      expect(safeNext(value), value).toBeNull()
    }
  })

  it('ignora caminho interno fora da lista', () => {
    for (const value of ['/panel', '/admin/estabelecimentos', '/sign-in', '/', '/convitex']) {
      expect(safeNext(value), value).toBeNull()
    }
  })

  it('ignora parâmetro desconhecido, fragmento, espaço e valor enorme ou vazio', () => {
    expect(safeNext('/cadastrar-estabelecimento?url=https://site.mal')).toBeNull()
    expect(safeNext('/convite?token=a&redirect=//site.mal')).toBeNull()
    expect(safeNext('/appointments#//site.mal')).toBeNull()
    expect(safeNext('/appointments x')).toBeNull()
    expect(safeNext(`/convite?token=${'a'.repeat(900)}`)).toBeNull()
    expect(safeNext('')).toBeNull()
    expect(safeNext(null)).toBeNull()
    expect(safeNext(undefined)).toBeNull()
  })

  it('o login só leva `next` quando ele passa pela lista', () => {
    expect(signInPath(undefined, '/cadastrar-estabelecimento')).toBe(
      '/sign-in?next=%2Fcadastrar-estabelecimento',
    )
    expect(signInPath(undefined, 'https://site.mal')).toBe('/sign-in')
    expect(signInPath('/appointments')).toBe('/sign-in?redirect=%2Fappointments')
  })

  it('sem sessão a entrada é a página que explica; com sessão, o assistente', () => {
    expect(businessEntryPath(false)).toBe(ROUTES.forBusinesses)
    expect(businessEntryPath(true)).toBe('/cadastrar-estabelecimento')
  })
})

describe('destino pendente depois da confirmação do e-mail', () => {
  beforeEach(() => vi.stubGlobal('localStorage', storage()))
  afterEach(() => vi.unstubAllGlobals())

  it('devolve o destino guardado para o mesmo e-mail, sem diferenciar maiúsculas', () => {
    rememberNext('Dono@Exemplo.com', '/cadastrar-estabelecimento')

    expect(readNext('dono@exemplo.com')).toBe('/cadastrar-estabelecimento')
  })

  it('guarda o caminho do convite, com o token, só neste armazenamento', () => {
    rememberNext('rafa@exemplo.com', '/convite?token=segredo-do-convite')

    expect(readNext('rafa@exemplo.com')).toBe('/convite?token=segredo-do-convite')
  })

  it('não devolve para outro e-mail', () => {
    rememberNext('dono@exemplo.com', '/cadastrar-estabelecimento')

    expect(readNext('outra@exemplo.com')).toBeNull()
  })

  it('não guarda destino fora da lista', () => {
    rememberNext('dono@exemplo.com', 'https://site.mal')
    rememberNext('dono@exemplo.com', '/panel')

    expect(readNext('dono@exemplo.com')).toBeNull()
  })

  it('vale por 48 horas', () => {
    rememberNext('dono@exemplo.com', '/cadastrar-estabelecimento', 1_000)

    expect(readNext('dono@exemplo.com', 1_000 + NEXT_TTL_MS)).toBe('/cadastrar-estabelecimento')
    expect(readNext('dono@exemplo.com', 1_000 + NEXT_TTL_MS + 1)).toBeNull()
  })

  it('apaga ao entrar', () => {
    rememberNext('dono@exemplo.com', '/cadastrar-estabelecimento')
    clearNext()

    expect(readNext('dono@exemplo.com')).toBeNull()
  })

  it('confere a lista de novo na leitura: dado adulterado no armazenamento é ignorado', () => {
    localStorage.setItem(
      'vagoo.next-after-confirmation',
      JSON.stringify({ email: 'dono@exemplo.com', path: 'https://site.mal', savedAt: Date.now() }),
    )

    expect(readNext('dono@exemplo.com')).toBeNull()
  })

  it('armazenamento quebrado ou ausente não lança erro', () => {
    localStorage.setItem('vagoo.next-after-confirmation', '{não é json')
    expect(readNext('dono@exemplo.com')).toBeNull()

    vi.stubGlobal('localStorage', undefined)
    expect(() => rememberNext('dono@exemplo.com', '/cadastrar-estabelecimento')).not.toThrow()
    expect(readNext('dono@exemplo.com')).toBeNull()
    expect(() => clearNext()).not.toThrow()
  })
})
