import { DOCUMENT_RULE, type DocumentRule } from './consts'

import { TextField } from '@components/text-field'

export type DocumentStepProps = {
  value: string
  error?: string
  onChange: (value: string) => void
  /** A regra do documento. O padrão é o texto provisório "em definição". */
  rule?: DocumentRule
}

/**
 * Passo do documento do estabelecimento, atrás de um ponto de extensão: a regra (o que cada categoria aceita e o
 * texto de ajuda) vem de `DOCUMENT_RULE`. O documento nunca é público, só o dono e o Admin veem, e nunca vai para log.
 */
export const DocumentStep = (props: DocumentStepProps) => {
  const { value, error, onChange, rule = DOCUMENT_RULE } = props

  return (
    <TextField
      id="business-document"
      label={rule.label}
      inputMode="text"
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      helper={rule.helpText}
      error={error}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
