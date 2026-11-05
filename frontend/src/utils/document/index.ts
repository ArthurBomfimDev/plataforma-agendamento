/**
 * CPF e CNPJ (numérico e alfanumérico). Espelha `Booking.Domain.ValueObject.Document`: a validação do cliente só poupa
 * uma ida ao servidor; quem decide é o servidor.
 *
 * CNPJ alfanumérico (IN RFB 2.229/2024, desde 31/07/2026): 14 caracteres, os 12 primeiros A-Z ou 0-9 e os 2 últimos
 * numéricos (dígitos verificadores). O valor de cada caractere é o código ASCII menos 48, então o CNPJ numérico antigo
 * cai na mesma rotina. A validação só prova que o número é bem formado, não que a empresa existe.
 */

export type DocumentKind = 'cpf' | 'cnpj'

const DIGIT = /^\d$/
const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

/** Tira a pontuação (`. - /` e espaços) e põe em maiúsculas. Não descarta letra. */
export const normalizeDocument = (raw: string) => raw.replace(/[.\-/\s]/g, '').toUpperCase()

const checkDigit = (value: string, weights: number[]) => {
  const sum = [...value].reduce(
    (total, char, index) => total + (char.charCodeAt(0) - 48) * weights[index]!,
    0,
  )
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

const isRepeated = (value: string) => new Set(value).size === 1

const isValidCpf = (value: string) => {
  if (![...value].every((char) => DIGIT.test(char)) || isRepeated(value)) return false
  const first = checkDigit(value.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const second = checkDigit(value.slice(0, 9) + first, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return Number(value[9]) === first && Number(value[10]) === second
}

const isValidCnpj = (value: string) => {
  const body = value.slice(0, 12)
  const verifiers = value.slice(12)
  if (!/^[A-Z0-9]{12}$/.test(body) || !/^\d{2}$/.test(verifiers) || isRepeated(value)) return false
  const first = checkDigit(body, CNPJ_WEIGHTS_1)
  const second = checkDigit(body + first, CNPJ_WEIGHTS_2)
  return Number(verifiers[0]) === first && Number(verifiers[1]) === second
}

export type DocumentCheck =
  | { valid: true; kind: DocumentKind; normalized: string }
  | { valid: false; reason: 'empty' | 'length' | 'check-digit' }

export const checkDocument = (raw: string): DocumentCheck => {
  const normalized = normalizeDocument(raw)
  if (normalized.length === 0) return { valid: false, reason: 'empty' }
  if (normalized.length === 11) {
    return isValidCpf(normalized)
      ? { valid: true, kind: 'cpf', normalized }
      : { valid: false, reason: 'check-digit' }
  }
  if (normalized.length === 14) {
    return isValidCnpj(normalized)
      ? { valid: true, kind: 'cnpj', normalized }
      : { valid: false, reason: 'check-digit' }
  }
  return { valid: false, reason: 'length' }
}

const MESSAGES = {
  empty: 'Informe o documento.',
  length: 'O documento deve ter 11 caracteres (CPF) ou 14 (CNPJ).',
  'check-digit': 'Documento inválido. Confira os dígitos.',
} as const

/** A mensagem de erro em português, ou `undefined` se o documento é válido. */
export const documentError = (raw: string) => {
  const result = checkDocument(raw)
  return result.valid ? undefined : MESSAGES[result.reason]
}
