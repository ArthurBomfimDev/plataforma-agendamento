import { checkDocument, documentError, normalizeDocument } from '.'
import { describe, expect, it } from 'vitest'

describe('normalizeDocument', () => {
  it('tira a pontuação e os espaços e põe em maiúsculas, sem descartar letras', () => {
    expect(normalizeDocument(' 12.abc.345/01de-35 ')).toBe('12ABC34501DE35')
    expect(normalizeDocument('529.982.247-25')).toBe('52998224725')
  })
})

describe('checkDocument', () => {
  it('aceita CPF e CNPJ numéricos válidos, com ou sem pontuação', () => {
    expect(checkDocument('529.982.247-25')).toEqual({
      valid: true,
      kind: 'cpf',
      normalized: '52998224725',
    })
    expect(checkDocument('11.222.333/0001-81')).toEqual({
      valid: true,
      kind: 'cnpj',
      normalized: '11222333000181',
    })
    expect(checkDocument('11222333000181').valid).toBe(true)
  })

  it('aceita o CNPJ alfanumérico do exemplo oficial da Receita, em maiúsculas ou minúsculas', () => {
    expect(checkDocument('12.ABC.345/01DE-35')).toEqual({
      valid: true,
      kind: 'cnpj',
      normalized: '12ABC34501DE35',
    })
    expect(checkDocument('12abc34501de35').valid).toBe(true)
    expect(checkDocument('AB12CD34EF5602').valid).toBe(true)
  })

  it.each([
    ['529.982.247-24', 'check-digit'], // CPF com dígito errado
    ['111.111.111-11', 'check-digit'], // CPF repetido
    ['11.222.333/0001-80', 'check-digit'], // CNPJ com dígito errado
    ['12.ABC.345/01DE-36', 'check-digit'], // alfanumérico com dígito errado
    ['12ABC34501DEAB', 'check-digit'], // letra no lugar dos dígitos verificadores
    ['AAAAAAAAAAAAAA', 'check-digit'], // repetido
    ['ABC.982.247-25', 'check-digit'], // CPF não aceita letra
    ['12ABC34501D!35', 'check-digit'], // símbolo no corpo
    ['123', 'length'],
    ['12ABC34501DE3', 'length'], // 13 caracteres
    ['12ABC34501DE355', 'length'], // 15 caracteres
    ['   ', 'empty'],
  ])('recusa %s (%s)', (raw, reason) => {
    expect(checkDocument(raw)).toEqual({ valid: false, reason })
  })
})

describe('documentError', () => {
  it('devolve a mensagem em português, ou nada se válido', () => {
    expect(documentError('11.222.333/0001-81')).toBeUndefined()
    expect(documentError('')).toBe('Informe o documento.')
    expect(documentError('123')).toBe('O documento deve ter 11 caracteres (CPF) ou 14 (CNPJ).')
    expect(documentError('11.222.333/0001-80')).toBe('Documento inválido. Confira os dígitos.')
  })
})
