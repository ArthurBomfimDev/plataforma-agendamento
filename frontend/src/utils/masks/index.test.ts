import { maskDocument, maskPostalCode, postalCodeDigits, unmaskDocument, unmaskPostalCode } from '.'
import { describe, expect, it } from 'vitest'

describe('maskPostalCode', () => {
  it('põe o hífen depois do quinto dígito, aos poucos', () => {
    expect(maskPostalCode('')).toBe('')
    expect(maskPostalCode('1')).toBe('1')
    expect(maskPostalCode('17471')).toBe('17471')
    expect(maskPostalCode('174713')).toBe('17471-3')
    expect(maskPostalCode('17471318')).toBe('17471-318')
  })

  it('cola com ou sem hífen, com espaço e lixo, e corta no oitavo dígito', () => {
    expect(maskPostalCode('17471-318')).toBe('17471-318')
    expect(maskPostalCode(' 17471 318 ')).toBe('17471-318')
    expect(maskPostalCode('ab17c471')).toBe('17471')
    expect(maskPostalCode('17471-3189999')).toBe('17471-318')
  })

  it('a API recebe só os dígitos', () => {
    expect(unmaskPostalCode('17471-318')).toBe('17471318')
    expect(postalCodeDigits('17471-318')).toBe('17471318')
  })
})

describe('maskDocument · CPF', () => {
  it('000.000.000-00, aos poucos', () => {
    expect(maskDocument('123')).toBe('123')
    expect(maskDocument('1234')).toBe('123.4')
    expect(maskDocument('1234567')).toBe('123.456.7')
    expect(maskDocument('1234567890')).toBe('123.456.789-0')
    expect(maskDocument('12345678909')).toBe('123.456.789-09')
  })

  it('colar valor já pontuado dá o mesmo resultado', () => {
    expect(maskDocument('123.456.789-09')).toBe('123.456.789-09')
    expect(maskDocument(' 123.456.789-09 ')).toBe('123.456.789-09')
  })
})

describe('maskDocument · CNPJ', () => {
  it('passa para 00.000.000/0000-00 a partir do 12º caractere', () => {
    expect(maskDocument('123456789012')).toBe('12.345.678/9012')
    expect(maskDocument('12345678901234')).toBe('12.345.678/9012-34')
  })

  it('colar CNPJ pontuado funciona', () => {
    expect(maskDocument('12.345.678/9012-34')).toBe('12.345.678/9012-34')
  })

  it('CNPJ alfanumérico (IN RFB 2.229/2024): letras nas 12 primeiras posições, em maiúsculas', () => {
    expect(maskDocument('ab3c5d7e9f01 23')).toBe('AB.3C5.D7E/9F01-23')
    expect(maskDocument('ab.3c5.d7e/9f01-23')).toBe('AB.3C5.D7E/9F01-23')
  })

  it('uma letra no começo já mostra que não é CPF', () => {
    expect(maskDocument('AB3C')).toBe('AB.3C')
  })

  it('corta no 14º caractere', () => {
    expect(maskDocument('1234567890123499')).toBe('12.345.678/9012-34')
  })
})

describe('unmaskDocument', () => {
  it('só os caracteres do documento, sem pontuação', () => {
    expect(unmaskDocument('123.456.789-09')).toBe('12345678909')
    expect(unmaskDocument('12.345.678/9012-34')).toBe('12345678901234')
    expect(unmaskDocument('ab.3c5.d7e/9f01-23')).toBe('AB3C5D7E9F0123')
  })

  it('a máscara e a desmáscara se desfazem', () => {
    for (const raw of ['12345678909', '12345678901234', 'AB3C5D7E9F0123']) {
      expect(unmaskDocument(maskDocument(raw))).toBe(raw)
    }
  })
})
