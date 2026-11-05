import { NO_ROLE, ROLE_OPTIONS } from './consts'
import { describe, expect, it } from 'vitest'

// A gaveta abre num portal, que o `renderToString` não desenha: o formulário aberto é verificado no navegador.
describe('InviteSheet', () => {
  it('nenhum papel vem marcado: a primeira opção é pedir a escolha', () => {
    expect(ROLE_OPTIONS[0]).toEqual({ value: NO_ROLE, label: 'Escolha o papel' })
  })

  it('oferece só os papéis convidáveis', () => {
    expect(ROLE_OPTIONS.map(({ value }) => value)).toEqual([NO_ROLE, 'Professional', 'Attendant'])
  })
})
