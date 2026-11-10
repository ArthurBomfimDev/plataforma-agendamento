import { ErrorState, LoadingState } from '@components/screen-state'
import { OVERLINE, seatsFull, seatsLabel } from '../../consts'
import { useState } from 'react'

import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import type { InvitesCardProps } from './types'
import type { PendingInvite } from '../../types'
import { notify } from '@components/toaster/notify'

const CARD = 'rounded-(--radius-md) border border-(--border-subtle) bg-(--bg-surface)'

/**
 * Convites pendentes (ADR-029): quem foi convidado e ainda não aceitou, com reenviar (link novo, prazo novo) e revogar.
 * Mostra as vagas: conta ativa e convite pendente ocupam vaga; com a equipe cheia, convidar fica desligado.
 */
export const InvitesCard = (props: InvitesCardProps) => {
  const { data, onInvite, onResend, onRevoke } = props
  const [revoking, setRevoking] = useState<PendingInvite | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const run = async (
    invite: PendingInvite,
    action: () => Promise<string | null>,
    success: string,
  ) => {
    setBusyId(invite.id)
    try {
      const failure = await action()
      if (failure) notify.error(failure)
      else notify.success(success)
    } finally {
      setBusyId(null)
    }
  }

  const full = data.status === 'ready' && seatsFull(data.seats)

  return (
    <section aria-labelledby="team-invites" className="flex flex-col gap-(--space-12)">
      <div className="flex flex-wrap items-center gap-(--space-12)">
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-(--space-2)">
          <h2 id="team-invites" className={OVERLINE}>
            Convites
          </h2>
          {data.status === 'ready' && data.seats && (
            <p className="type-caption text-(--text-muted)">{seatsLabel(data.seats)}</p>
          )}
        </div>
        <Button variant="secondary" onClick={onInvite} disabled={full}>
          Convidar
        </Button>
      </div>

      {full && (
        <p role="status" className="type-caption text-(--text-muted)">
          A equipe está completa. Revogue um convite ou remova alguém para convidar de novo.
        </p>
      )}

      {data.status === 'loading' ? (
        <LoadingState label="Carregando os convites…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : data.invites.length === 0 ? (
        <p role="status" className="type-body text-(--text-muted)">
          Nenhum convite pendente. Convide quem vai ter acesso próprio: profissional (agenda dele)
          ou atendente (agenda de todos).
        </p>
      ) : (
        <ul className={`${CARD} flex flex-col divide-y divide-(--border-subtle) px-4.5`}>
          {data.invites.map((invite) => (
            <li key={invite.id} className="flex flex-wrap items-center gap-(--space-12) py-3">
              <div className="flex min-w-0 flex-1 basis-56 flex-col gap-(--space-2)">
                <p className="type-body text-(--text-strong)">
                  {invite.name} · {invite.roleLabel}
                  {invite.specialty ? ` · ${invite.specialty}` : ''}
                </p>
                <p className="type-caption break-all text-(--text-muted)">
                  {invite.email} · vale até {invite.validUntil}
                </p>
              </div>
              <div className="flex gap-(--space-8)">
                <Button
                  variant="secondary"
                  disabled={busyId === invite.id}
                  onClick={() => void run(invite, () => onResend(invite.id), 'Convite reenviado.')}
                >
                  Reenviar
                </Button>
                <Button
                  variant="ghost"
                  disabled={busyId === invite.id}
                  onClick={() => setRevoking(invite)}
                >
                  Revogar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="Revogar este convite?"
        description={
          revoking
            ? `O link enviado para ${revoking.email} deixa de funcionar. A vaga fica livre.`
            : ''
        }
        confirmLabel="Revogar convite"
        dismissLabel="Manter convite"
        onConfirm={() => {
          if (revoking) void run(revoking, () => onRevoke(revoking.id), 'Convite revogado.')
          setRevoking(null)
        }}
      />
    </section>
  )
}
