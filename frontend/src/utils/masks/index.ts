/**
 * Máscaras de campo, num lugar só. Cada `mask*` recebe o que a pessoa digitou ou colou (com ou sem pontuação) e devolve o
 * texto do campo; cada `unmask*` devolve o que a API recebe: só os caracteres do valor, sem pontuação. A validação
 * (dígito verificador) fica em `@utils/document` e roda ao sair do campo, não a cada tecla.
 */

/** Aplica `pattern` ao `value`: cada `#` consome um caractere; o resto do padrão é literal e só aparece se houver o que vir depois. */
const applyPattern = (value: string, pattern: string) => {
  let out = ''
  let index = 0
  for (const slot of pattern) {
    if (index >= value.length) break
    if (slot === '#') {
      out += value[index]
      index += 1
    } else {
      out += slot
    }
  }
  return out
}

export const onlyDigits = (value: string) => value.replace(/\D/g, '')

// --- CEP -------------------------------------------------------------------------------------------------------

/** `00000-000`. Aceita o valor com ou sem hífen e corta no oitavo dígito. */
export const maskPostalCode = (value: string) =>
  applyPattern(onlyDigits(value).slice(0, 8), '#####-###')

export const unmaskPostalCode = onlyDigits

/** Os 8 dígitos do CEP, para a API. */
export const postalCodeDigits = unmaskPostalCode

// --- CPF e CNPJ ------------------------------------------------------------------------------------------------

const CPF_PATTERN = '###.###.###-##'
const CNPJ_PATTERN = '##.###.###/####-##'

/** Os caracteres do documento, em maiúsculas, sem `. - /` nem espaço. Não descarta letra: o CNPJ pode ser alfanumérico. */
export const unmaskDocument = (value: string) => value.replace(/[^0-9A-Za-z]/g, '').toUpperCase()

/**
 * CPF `000.000.000-00` até 11 dígitos; CNPJ `00.000.000/0000-00` a partir do 12º caractere ou assim que aparece uma letra
 * (CPF só tem dígito). O CNPJ alfanumérico (IN RFB 2.229/2024) tem letras nas 12 primeiras posições. Corta em 14.
 */
export const maskDocument = (value: string) => {
  const raw = unmaskDocument(value).slice(0, 14)
  const isCpf = raw.length <= 11 && /^\d*$/.test(raw)
  return applyPattern(raw, isCpf ? CPF_PATTERN : CNPJ_PATTERN)
}
