import { ApiError, UserMessageError, errorMessage } from './errors'
import { describe, expect, it } from 'vitest'

describe('errorMessage', () => {
  it('mostra a mensagem que a própria aplicação escreveu', () => {
    const message = 'Não foi possível localizar o endereço. Confira os dados.'

    expect(errorMessage(new UserMessageError(message))).toBe(message)
  })

  it('não vaza texto técnico de um erro qualquer', () => {
    expect(errorMessage(new TypeError('x is undefined'))).toBe('Algo deu errado. Tente de novo.')
  })

  it('o código da API continua decidindo a mensagem', () => {
    expect(errorMessage(new ApiError(400, 'consent.version_outdated'))).toContain('mudou')
  })
})
