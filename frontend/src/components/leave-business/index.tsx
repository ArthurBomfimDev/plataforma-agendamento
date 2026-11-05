import { useState } from 'react'

import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'

export type LeaveBusinessProps = {
  businessName: string
  /** Resolve `null` se saiu, senão a mensagem de erro em português. */
  onLeave: () => Promise<string | null>
}

/**
 * "Sair do estabelecimento" (ADR-031), para quem tem conta na equipe (profissional ou atendente). Remove o vínculo e o
 * perfil sai da vitrine na hora; o histórico de agendamentos permanece. Pede confirmação, porque para voltar é preciso um
 * convite novo.
 */
export const LeaveBusiness = ({ businessName, onLeave }: LeaveBusinessProps) => {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  return (
    <section aria-labelledby="leave-business" className="flex flex-col gap-(--space-8)">
      <h2 id="leave-business" className="type-label text-(--text-strong)">
        Sair do estabelecimento
      </h2>
      <p className="type-caption text-(--text-muted)">
        Você deixa a equipe de {businessName}. Seu perfil sai da página pública na hora. Os
        agendamentos já feitos continuam no histórico. Para voltar, é preciso um novo convite.
      </p>
      {error && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {error}
        </p>
      )}
      <Button
        variant="secondary"
        className="self-start"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Sair do estabelecimento
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Sair do estabelecimento?"
        description={`Você deixa a equipe de ${businessName} e seu perfil sai da página pública. Para voltar, é preciso um novo convite.`}
        confirmLabel="Sair da equipe"
        dismissLabel="Ficar na equipe"
        onConfirm={async () => {
          setOpen(false)
          setError(undefined)
          setBusy(true)
          const failure = await onLeave()
          setBusy(false)
          if (failure) setError(failure)
        }}
      />
    </section>
  )
}
