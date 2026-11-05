import { checkDocument } from '@utils/document'

/**
 * Regra de cadastro, Versão B (decidida em 04/11, ADR-028): toda categoria aceita CPF ou CNPJ, para incluir o autônomo
 * informal. MEI usa CNPJ. O servidor confere de novo; aqui a validação só poupa a ida até ele e dá a mensagem do campo.
 */
export type BusinessDocumentType = 'Cnpj' | 'Cpf'

export const DOCUMENT_TYPE_OPTIONS: ReadonlyArray<{
  value: BusinessDocumentType
  label: string
  description: string
}> = [
  { value: 'Cnpj', label: 'Empresa (CNPJ)', description: 'Inclui quem é MEI.' },
  {
    value: 'Cpf',
    label: 'Autônomo(a) (CPF)',
    description: 'Para quem trabalha sem empresa aberta.',
  },
]

export const DOCUMENT_HELP_TEXT =
  'Com CNPJ (inclusive MEI, que é gratuito e se abre em minutos no Portal do Empreendedor) você fica pronto para receber pagamentos quando a plataforma passar a oferecê-los.'

const NAMES: Record<BusinessDocumentType, string> = { Cnpj: 'CNPJ', Cpf: 'CPF' }

const LENGTH_MESSAGES: Record<BusinessDocumentType, string> = {
  Cnpj: 'O CNPJ tem 14 caracteres.',
  Cpf: 'O CPF tem 11 dígitos.',
}

export const documentLabel = (type: BusinessDocumentType) => NAMES[type]

/** A mensagem do campo, em português, ou `undefined` se o documento é válido para o tipo escolhido. */
export const documentTypeError = (raw: string, type: BusinessDocumentType) => {
  const result = checkDocument(raw)
  const name = NAMES[type]

  if (result.valid) {
    const found: BusinessDocumentType = result.kind === 'cpf' ? 'Cpf' : 'Cnpj'
    return found === type
      ? undefined
      : `Este número é um ${NAMES[found]}. Informe um ${name} ou troque a opção acima.`
  }
  if (result.reason === 'empty') return `Informe o ${name}.`
  if (result.reason === 'length') return LENGTH_MESSAGES[type]
  return `${name} inválido. Confira os dígitos.`
}
