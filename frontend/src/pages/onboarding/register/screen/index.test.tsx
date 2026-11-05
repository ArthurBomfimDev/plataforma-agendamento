import { describe, expect, it } from 'vitest'
import {
  hasErrors,
  nextStep,
  previousStep,
  stepsFor,
  validateAddress,
  validateBusiness,
  validateResponsible,
} from './consts'

import { documentTypeError } from './components/document-step/consts'
import { RegisterBusinessScreen } from '.'
import type { RegisterScreenProps } from './types'
import { renderToString } from 'react-dom/server'

const noop = async () => null

const render = (overrides: Partial<RegisterScreenProps> = {}) =>
  renderToString(
    <RegisterBusinessScreen
      onCreate={noop}
      onLocateAddress={async () => ({ status: 'not-found' })}
      onConfirmLocation={noop}
      onSaveResponsible={noop}
      onFinish={noop}
      onLookupPostalCode={async () => null}
      onLeave={() => undefined}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('passos do assistente', () => {
  it('Beleza não tem o passo do responsável; Saúde tem', () => {
    expect(stepsFor('Beleza')).toEqual(['business', 'document', 'address', 'review'])
    expect(stepsFor('Saude')).toEqual(['business', 'document', 'address', 'responsible', 'review'])
  })

  it('avança e volta na ordem da categoria, sem passar das pontas', () => {
    expect(nextStep('Beleza', 'address')).toBe('review')
    expect(nextStep('Saude', 'address')).toBe('responsible')
    expect(nextStep('Saude', 'review')).toBe('review')
    expect(previousStep('Saude', 'review')).toBe('responsible')
    expect(previousStep('Beleza', 'business')).toBe('business')
  })
})

describe('validação, um erro por campo', () => {
  it('negócio: o nome é obrigatório e vai até 150 caracteres', () => {
    expect(validateBusiness({ name: '   ', category: 'Beleza' }).name).toBe(
      'Informe o nome do estabelecimento.',
    )
    expect(validateBusiness({ name: 'x'.repeat(151), category: 'Beleza' }).name).toContain('150')
    expect(hasErrors(validateBusiness({ name: 'Studio Silva', category: 'Beleza' }))).toBe(false)
  })

  it('endereço: CEP de 8 dígitos, rua, número, bairro, cidade e UF', () => {
    const errors = validateAddress({
      postalCode: '123',
      street: '',
      streetNumber: '',
      district: '',
      city: '',
      state: 'S',
    })

    expect(Object.keys(errors).sort()).toEqual([
      'city',
      'district',
      'postalCode',
      'state',
      'street',
      'streetNumber',
    ])
    expect(
      hasErrors(
        validateAddress({
          postalCode: '17400-000',
          street: 'Rua A',
          streetNumber: 's/n',
          district: 'Centro',
          city: 'Garça',
          state: 'SP',
        }),
      ),
    ).toBe(false)
  })

  it('responsável: nome, número do registro e UF', () => {
    expect(
      Object.keys(
        validateResponsible({ name: '', council: 'Crm', councilNumber: '//', councilState: 'S' }),
      ).sort(),
    ).toEqual(['councilNumber', 'councilState', 'name'])
    expect(
      hasErrors(
        validateResponsible({
          name: 'Ana',
          council: 'Crp',
          councilNumber: '06/12345',
          councilState: 'SP',
        }),
      ),
    ).toBe(false)
  })
})

describe('regra do documento (Versão B)', () => {
  it('aceita o documento do tipo escolhido, incluindo o CNPJ alfanumérico', () => {
    expect(documentTypeError('529.982.247-25', 'Cpf')).toBeUndefined()
    expect(documentTypeError('11.222.333/0001-81', 'Cnpj')).toBeUndefined()
    expect(documentTypeError('12.ABC.345/01DE-35', 'Cnpj')).toBeUndefined()
  })

  it('recusa com a mensagem do campo: vazio, tamanho, dígito e o documento do outro tipo', () => {
    expect(documentTypeError('', 'Cpf')).toBe('Informe o CPF.')
    expect(documentTypeError('', 'Cnpj')).toBe('Informe o CNPJ.')
    expect(documentTypeError('123', 'Cpf')).toBe('O CPF tem 11 dígitos.')
    expect(documentTypeError('123', 'Cnpj')).toBe('O CNPJ tem 14 caracteres.')
    expect(documentTypeError('529.982.247-26', 'Cpf')).toBe('CPF inválido. Confira os dígitos.')
    expect(documentTypeError('11.222.333/0001-80', 'Cnpj')).toBe(
      'CNPJ inválido. Confira os dígitos.',
    )
    expect(documentTypeError('11.222.333/0001-81', 'Cpf')).toContain('Este número é um CNPJ')
    expect(documentTypeError('529.982.247-25', 'Cnpj')).toContain('Este número é um CPF')
  })
})

describe('RegisterBusinessScreen', () => {
  it('começa no negócio: nome, as duas categorias com o que cada uma pede, e "Continuar"', () => {
    const html = render()

    expect(html).toContain('Passo 1 de 4 · Negócio')
    expect(html).toContain('Cadastrar meu estabelecimento')
    expect(html).toContain('Nome do estabelecimento')
    expect(html).toContain('Beleza')
    expect(html).toContain('Saúde')
    expect(html).toContain('passa por análise')
    expect(html).toContain('Continuar')
    expect(html).toContain('Continuar depois')
  })

  it('o passo do documento pergunta o tipo, oferece "Sou MEI" com CNPJ e o texto sobre o CNPJ', () => {
    const html = render({ initialStep: 'document' })

    expect(html).toContain('Passo 2 de 4 · Documento')
    expect(html).toContain('Empresa (CNPJ)')
    expect(html).toContain('Autônomo(a) (CPF)')
    expect(html).toContain('Sou MEI')
    expect(html).toContain('Portal do Empreendedor')
    expect(html).toContain('Não aparece na página pública')
    expect(html).not.toContain('em definição')
    expect(html).toContain('Criar e continuar')
  })

  it('o endereço traz o CEP com "Buscar CEP" e retoma o que já foi salvo', () => {
    const html = render({
      initialStep: 'address',
      createdCategory: 'Beleza',
      savedAddress: { street: 'Rua das Flores', city: 'Garça', state: 'SP' },
    })

    expect(html).toContain('Passo 3 de 4 · Endereço')
    expect(html).toContain('Buscar CEP')
    expect(html).toContain('value="Rua das Flores"')
    expect(html).toContain('Salvar e confirmar a localização')
  })

  it('o responsável só existe em Saúde, e diz que só o Admin vê o registro', () => {
    const html = render({ initialStep: 'responsible', createdCategory: 'Saude' })

    expect(html).toContain('Passo 4 de 5 · Responsável')
    expect(html).toContain('Número do registro')
    expect(html).toContain('CRP — Psicologia')
    expect(html).toContain('Só ele vê estes dados')
  })

  it('a revisão exige o aceite dos termos e diz o que vem depois (publicar × análise)', () => {
    const beauty = render({ initialStep: 'review', createdCategory: 'Beleza' })
    const health = render({ initialStep: 'review', createdCategory: 'Saude' })

    expect(beauty).toContain('Passo 4 de 4 · Revisão')
    expect(beauty).toContain('Li e aceito os termos')
    expect(beauty).toContain('Texto provisório, ainda sem revisão jurídica')
    expect(beauty).toContain('Tenho autorização dos profissionais')
    expect(beauty).toContain('você publica na hora')
    expect(health).toContain('você envia para análise')
    expect(beauty).not.toContain('Continuar depois')
  })

  it('mostra o erro do servidor com role="alert" só depois de uma tentativa; no início não há erro', () => {
    expect(render({ initialStep: 'document' })).not.toContain('role="alert"')
  })
})
