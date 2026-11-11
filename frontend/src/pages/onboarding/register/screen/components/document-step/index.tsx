import {
  type BusinessDocumentType,
  DOCUMENT_HELP_TEXT,
  DOCUMENT_TYPE_OPTIONS,
  documentLabel,
} from './consts'

import { Checkbox } from '@components/checkbox'
import { RadioOptionGroup } from '@components/radio-option-group'
import { TextField } from '@components/text-field'
import { maskDocument, unmaskDocument } from '@utils/masks'

export type DocumentStepProps = {
  type: BusinessDocumentType
  value: string
  isMei: boolean
  error?: string
  onTypeChange: (type: BusinessDocumentType) => void
  onChange: (value: string) => void
  onMeiChange: (isMei: boolean) => void
  /** Ao sair do campo: é quando o dígito verificador é conferido, não a cada tecla. */
  onBlur?: () => void
}

/**
 * Passo do documento (Versão B, ADR-028): toda categoria aceita CPF ou CNPJ. "Sou MEI" é informativo e só aparece com
 * CNPJ. O documento nunca é público, só o dono e o Admin veem, e nunca vai para log.
 */
export const DocumentStep = (props: DocumentStepProps) => {
  const { type, value, isMei, error, onTypeChange, onChange, onMeiChange, onBlur } = props

  return (
    <div className="flex flex-col gap-(--space-12)">
      <fieldset className="flex flex-col gap-(--space-8)">
        <legend className="type-label mb-(--space-8) text-(--text-body)">
          Como você vai se cadastrar?
        </legend>
        <RadioOptionGroup
          aria-label="Tipo de documento"
          value={type}
          options={DOCUMENT_TYPE_OPTIONS}
          onValueChange={onTypeChange}
        />
      </fieldset>

      <TextField
        id="business-document"
        label={documentLabel(type)}
        // CPF só tem dígito: teclado numérico. O CNPJ pode ter letras (alfanumérico, IN RFB 2.229/2024): teclado de texto.
        inputMode={type === 'Cpf' ? 'numeric' : 'text'}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder={type === 'Cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
        helper="Só você e a administração veem. Não aparece na página pública."
        error={error}
        value={maskDocument(value)}
        onChange={(event) => onChange(unmaskDocument(event.target.value))}
        onBlur={onBlur}
      />

      {type === 'Cnpj' && (
        <Checkbox
          label="Sou MEI"
          checked={isMei}
          onCheckedChange={(checked) => onMeiChange(checked === true)}
        />
      )}

      <p className="type-caption text-(--text-muted)">{DOCUMENT_HELP_TEXT}</p>
    </div>
  )
}
