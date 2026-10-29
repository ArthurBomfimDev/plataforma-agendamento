import type { AgendaEntry, AgendaRow } from '../../types'
import { CARD, INTERACTIVE } from './consts'
import { Clock, Lock, Plus, User } from 'lucide-react'
import { addHours, differenceInMinutes } from 'date-fns'
import { buildRows, expiryLabel, freeLabel } from '../../consts'

import type { DayListProps } from './types'
import { MOCK_CONFIRMATION_HOURS } from '@features/availability/mock'
import { StatusChip } from '@components/status-chip'
import { cardTitle } from './components/card-title'
import { cn } from 'cn'
import { motion } from 'framer-motion'
import { timeColumn } from './components/time-column'

/**
 * Agenda do dia de UM profissional, como lista cronológica (P01). É o redesenho do painel para
 * 390px (PROJECT-CONTEXT §4.1): no celular não cabe uma coluna por profissional.
 */
export const DayList = (props: DayListProps) => {
  const { professional, now, onOpen, onFitIn } = props

  const renderEntry = (entry: AgendaEntry) => {
    if (entry.kind === 'block') {
      return (
        <div
          className={cn(
            CARD,
            'border border-l-3 border-(--agenda-blocked-border) bg-(--agenda-blocked-bg)',
          )}
        >
          {cardTitle(
            <Lock aria-hidden="true" className="size-4 shrink-0 text-(--text-muted)" />,
            entry.label,
            'text-(--text-muted)',
          )}
          {entry.detail && <p className="type-caption text-(--text-muted)">{entry.detail}</p>}
        </div>
      )
    }

    if (entry.status === 'pending') {
      const remaining = entry.requestedAt
        ? differenceInMinutes(addHours(entry.requestedAt, MOCK_CONFIRMATION_HOURS), now)
        : 0

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
            <Clock aria-hidden="true" className="size-4 shrink-0 text-(--status-pending-fg)" />,
            entry.serviceName,
            'text-(--status-pending-fg)',
            <StatusChip status="pending" className="shrink-0" />,
          )}
          <p className="type-caption tabular text-(--status-pending-fg)">
            {entry.customerName} ·{' '}
            {remaining > 0 ? `expira em ${expiryLabel(remaining)}` : 'prazo encerrado'}
          </p>
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
          <User aria-hidden="true" className="size-4 shrink-0 text-(--text-strong)" />,
          entry.serviceName,
          'text-(--text-strong)',
        )}
        <p className="type-caption text-(--text-muted)">{entry.customerName} · confirmado</p>
      </button>
    )
  }

  const renderRow = (row: AgendaRow) => {
    if (row.type === 'entry') {
      return (
        <div className="flex items-start gap-(--space-12)">
          {timeColumn(row.entry.start, `${row.entry.durationMinutes} min`)}
          {renderEntry(row.entry)}
        </div>
      )
    }

    if (row.type === 'free') {
      return (
        <div className="flex items-center gap-(--space-12)">
          <div aria-hidden="true" className="w-13 shrink-0" />
          <button
            type="button"
            onClick={() => onFitIn?.(row.start)}
            className="flex min-h-(--size-touch-min) min-w-0 flex-1 items-center gap-(--space-8) rounded-md border border-dashed border-(--agenda-free-border) px-(--space-12) py-(--space-8) text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <Plus aria-hidden="true" className="size-4 shrink-0 text-(--text-link)" />
            <span className="type-caption tabular min-w-0 flex-1 text-(--text-muted)">
              {freeLabel(row.start, row.end)}
            </span>
            <span className="type-caption text-(--text-link)">Encaixar</span>
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-start gap-(--space-12)">
        {timeColumn(row.start, undefined, true)}
        <div className={cn(CARD, 'bg-(--agenda-off-hours-bg)')}>
          <p className="type-body text-(--text-disabled)">Fora do expediente</p>
        </div>
      </div>
    )
  }

  return (
    <ol aria-label={`Agenda de ${professional.name}`} className="flex flex-col gap-(--space-8)">
      {buildRows(professional).map((row, index) => (
        // Os itens entram em sequência, de cima para baixo.
        <motion.li
          key={row.type === 'entry' ? row.entry.id : `${row.type}-${row.start}`}
          layout="position"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          {renderRow(row)}
        </motion.li>
      ))}
    </ol>
  )
}
