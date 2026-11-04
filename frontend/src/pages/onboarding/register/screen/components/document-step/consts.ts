import { documentError } from '@utils/document'

/**
 * PONTO DE EXTENSÃO da regra de cadastro (versões A e B, ainda em aberto).
 *
 * Quando o Arthur decidir qual documento cada categoria aceita (CNPJ obrigatório, ou CPF ou CNPJ), só este arquivo
 * muda: o rótulo, o texto de ajuda e `validate`. O restante do assistente não sabe da regra. Enquanto isso, o texto é
 * provisório e a validação só confere o formato (CPF, CNPJ numérico e CNPJ alfanumérico).
 *
 * Fora do escopo aqui: o modo "Atendo na minha casa" (só existe na versão B).
 */
export type DocumentRule = {
  label: string
  helpText: string
  /** Mensagem de erro em português, ou `undefined` se o documento é aceito. */
  validate: (raw: string, category: 'Beleza' | 'Saude') => string | undefined
}

export const DOCUMENT_RULE: DocumentRule = {
  label: 'Documento do estabelecimento',
  helpText: 'Regra do documento em definição. Por enquanto, informe o CPF ou o CNPJ.',
  validate: (raw) => documentError(raw),
}
