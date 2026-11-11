import { REPORT_MAX_LENGTH, reasonError } from '@components/report-business'
import { useState } from 'react'

import { Button } from '@components/button'
import { TextField } from '@components/text-field'

export const REMOVAL_CONTACT_MAX_LENGTH = 150

export type RequestProfileRemovalProps = {
  /** Envia o pedido. `null` se deu certo, senão a mensagem de erro em português. */
  onSubmit: (reason: string, contact: string | null) => Promise<string | null>
}

/**
 * "Solicitar remoção deste perfil", no fim da página pública do profissional (ADR-031). Não pede conta. O pedido vai ao
 * dono por e-mail e cai na fila do Admin; nada some sozinho. O contato é opcional, serve para o estabelecimento
 * responder, e só chega ao dono e ao Admin. Não guarda IP.
 */
export const RequestProfileRemoval = ({ onSubmit }: RequestProfileRemovalProps) => {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [contact, setContact] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <p role="status" className="type-body text-(--text-muted)">
        Recebemos o seu pedido. O estabelecimento e um administrador vão analisar. Obrigado por
        avisar.
      </p>
    )
  }

  if (!open) {
    return (
      <Button variant="ghost" className="self-start" onClick={() => setOpen(true)}>
        Solicitar remoção deste perfil
      </Button>
    )
  }

  return (
    <form
      noValidate
      aria-label="Solicitar remoção deste perfil"
      className="flex flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)"
      onSubmit={async (event) => {
        event.preventDefault()
        const found = reasonError(reason)
        setFieldError(found)
        if (found) return
        setError(undefined)
        setBusy(true)
        const failure = await onSubmit(reason.trim(), contact.trim() || null)
        setBusy(false)
        if (failure) setError(failure)
        else setSent(true)
      }}
    >
      <TextField
        id="removal-reason"
        label="Por que este perfil deve sair?"
        helper="Não escreva dados de saúde. O pedido vai ao estabelecimento e à administração."
        maxLength={REPORT_MAX_LENGTH}
        value={reason}
        error={fieldError}
        onChange={(event) => {
          setReason(event.target.value)
          setFieldError(undefined)
        }}
      />
      <TextField
        id="removal-contact"
        label="Seu contato (opcional)"
        helper="E-mail ou telefone, para o estabelecimento responder. Só ele e a administração veem."
        autoComplete="off"
        maxLength={REMOVAL_CONTACT_MAX_LENGTH}
        value={contact}
        onChange={(event) => setContact(event.target.value)}
      />
      {error && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {error}
        </p>
      )}
      <div className="flex gap-(--space-8)">
        <Button type="submit" disabled={busy}>
          {busy ? 'Enviando…' : 'Enviar pedido'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
