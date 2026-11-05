import { CARD, INTERACTIVE, STATUS_TEXT } from '../../consts'
import { LockIcon, PersonIcon, ScheduleIcon } from '@assets/icons'
import { expiryLabel, minutesToExpire } from '../../../../consts'

import type { AgendaEntry } from '../../../../types'
import { StatusChip } from '@components/status-chip'
import { cardTitle } from '../card-title'
import { cn } from 'cn'

type EntryCardProps = {
  entry: AgendaEntry
  now: Date
  onOpen: (id: string) => void
  /** Na lista de todos (atendente), cada item diz com quem é. */
  professionalName?: string
}

/** Um item da agenda em forma de lista: bloqueio, pedido pendente ou agendamento. */
export const EntryCard = (props: EntryCardProps) => {
  const { entry, now, onOpen, professionalName } = props
  const professional = professionalName && (
    <p className="type-caption text-(--text-body)">Com {professionalName}</p>
  )

  if (entry.kind === 'block') {
    return (
      <div
        className={cn(
          CARD,
          'border border-l-3 border-(--agenda-blocked-border) bg-(--agenda-blocked-bg)',
        )}
      >
        {cardTitle(
          <LockIcon aria-hidden="true" className="size-4 shrink-0 text-(--text-muted)" />,
          entry.label,
          'text-(--text-muted)',
        )}
        {entry.detail && <p className="type-caption text-(--text-muted)">{entry.detail}</p>}
        {professional}
      </div>
    )
  }

  if (entry.status === 'pending') {
    const remaining = minutesToExpire(entry, now)

    return (
      <button
        type="button"
        onClick={() => onOpen(entry.id)}
        className={cn(
          CARD,
          INTERACTIVE,
          'border border-l-3 border-(--status-pending-fg) bg-(--status-pending-bg)',
        )}
      >
        {cardTitle(
          <ScheduleIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-(--status-pending-fg)"
          />,
          entry.serviceName,
          'text-(--status-pending-fg)',
          <StatusChip status="pending" className="shrink-0" />,
        )}
        <p className="type-caption tabular text-(--status-pending-fg)">
          {entry.customerName} ·{' '}
          {remaining > 0 ? `expira em ${expiryLabel(remaining)}` : 'prazo encerrado'}
        </p>
        {professional}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(entry.id)}
      className={cn(
        CARD,
        INTERACTIVE,
        'border border-(--agenda-busy-border) bg-(--agenda-busy-bg)',
      )}
    >
      {cardTitle(
        <PersonIcon aria-hidden="true" className="size-4 shrink-0 text-(--text-strong)" />,
        entry.serviceName,
        'text-(--text-strong)',
        entry.status !== 'confirmed' && <StatusChip status={entry.status} className="shrink-0" />,
      )}
      <p className="type-caption text-(--text-muted)">
        {entry.customerName} · {STATUS_TEXT[entry.status]}
      </p>
      {professional}
    </button>
  )
}
