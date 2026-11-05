import { Button } from '@components/button'
import { TextField } from '@components/text-field'
import { useState } from 'react'

export const REPORT_MIN_LENGTH = 5
export const REPORT_MAX_LENGTH = 500

export type ReportBusinessProps = {
  /** Envia a denúncia. `null` se deu certo, senão a mensagem de erro em português. */
  onSubmit: (reason: string) => Promise<string | null>
}

/** Erro de campo do motivo (5 a 500 caracteres), ou `undefined` se serve. */
export const reasonError = (reason: string) => {
  const length = reason.trim().length
  if (length < REPORT_MIN_LENGTH)
    return `Conte o motivo com pelo menos ${REPORT_MIN_LENGTH} caracteres.`
  if (length > REPORT_MAX_LENGTH) return `O motivo pode ter até ${REPORT_MAX_LENGTH} caracteres.`
  return undefined
}

/**
 * "Denunciar este estabelecimento", no fim da página pública. Não pede conta. A denúncia cai numa fila do Admin, que
 * decide; nada some sozinho. Não guarda IP nem dado do aparelho; só o motivo (e a conta, se a pessoa estiver logada).
 */
export const ReportBusiness = ({ onSubmit }: ReportBusinessProps) => {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <p role="status" className="type-body text-(--text-muted)">
        Recebemos a sua denúncia. Um administrador vai analisar. Obrigado por avisar.
      </p>
    )
  }

  if (!open) {
    return (
      <Button variant="ghost" className="self-start" onClick={() => setOpen(true)}>
        Denunciar este estabelecimento
      </Button>
    )
  }

  return (
    <form
      noValidate
      aria-label="Denunciar este estabelecimento"
      className="flex flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)"
      onSubmit={async (event) => {
        event.preventDefault()
        const found = reasonError(reason)
        setFieldError(found)
        if (found) return
        setError(undefined)
        setBusy(true)
        const failure = await onSubmit(reason.trim())
        setBusy(false)
        if (failure) setError(failure)
        else setSent(true)
      }}
    >
      <TextField
        id="report-reason"
        label="O que há de errado?"
        helper="Não escreva dados de saúde. Sua denúncia não mostra o seu nome ao estabelecimento."
        maxLength={REPORT_MAX_LENGTH}
        value={reason}
        error={fieldError}
        onChange={(event) => {
          setReason(event.target.value)
          setFieldError(undefined)
        }}
      />
      {error && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {error}
        </p>
      )}
      <div className="flex gap-(--space-8)">
        <Button type="submit" disabled={busy}>
          {busy ? 'Enviando…' : 'Enviar denúncia'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
