import { describe, expect, it } from 'vitest'
import { postalCodeFeedback, validateAddress } from './consts'

const FULL = {
  postalCode: '17400-000',
  street: 'Rua das Flores',
  streetNumber: '10',
  district: 'Centro',
  city: 'Garça',
  state: 'SP',
}

describe('validateAddress: um erro claro por campo', () => {
  it('endereço completo: nenhum erro', () => {
    expect(validateAddress(FULL)).toEqual({})
  })

  it('formulário vazio: cada campo diz o que falta', () => {
    expect(
      validateAddress({
        postalCode: '',
        street: '',
        streetNumber: '',
        district: '',
        city: '',
        state: '',
      }),
    ).toEqual({
      postalCode: 'Informe o CEP com 8 dígitos.',
      street: 'Informe a rua.',
      streetNumber: 'Informe o número (ou "s/n").',
      district: 'Informe o bairro.',
      city: 'Informe a cidade.',
      state: 'Informe a UF com 2 letras.',
    })
  })

  it('rua e número são obrigatórios, mesmo com o CEP certo', () => {
    const errors = validateAddress({ ...FULL, street: '  ', streetNumber: ' ' })

    expect(errors.street).toBe('Informe a rua.')
    expect(errors.streetNumber).toBe('Informe o número (ou "s/n").')
    expect(errors.postalCode).toBeUndefined()
  })

  it('aceita o CEP com e sem hífen, e recusa o incompleto', () => {
    expect(validateAddress({ ...FULL, postalCode: '17400000' }).postalCode).toBeUndefined()
    expect(validateAddress({ ...FULL, postalCode: '1740-000' }).postalCode).toBeDefined()
  })
})

describe('postalCodeFeedback: o que "Buscar CEP" diz', () => {
  const found = {
    postalCode: '17404500',
    street: 'Avenida Presidente Vargas',
    district: 'José Ribeiro',
    city: 'Garça',
    state: 'SP',
  }

  it('achou a rua: pede só o número e leva o cursor a ele', () => {
    expect(postalCodeFeedback(found)).toEqual({
      message: 'Preenchemos a rua, o bairro e a cidade. Confira e informe o número.',
      focus: 'number',
    })
  })

  it('CEP geral da cidade, sem rua: pede rua, número e bairro', () => {
    expect(postalCodeFeedback({ ...found, street: null, district: null })).toEqual({
      message: 'Este CEP é da cidade toda, sem rua. Preencha a rua, o número e o bairro.',
      focus: 'street',
    })
  })

  it('não achou: manda preencher à mão, sem apagar nada', () => {
    expect(postalCodeFeedback(null)).toEqual({
      message: 'CEP não encontrado. Preencha o endereço à mão.',
      focus: 'street',
    })
  })
})
