import { AddIcon } from '@assets/icons'
import type { AgendaRow } from '../../types'
import { CARD } from './consts'
import type { DayListProps } from './types'
import { EntryCard } from './components/entry-card'
import { buildRows, freeLabel } from '../../consts'
import { cn } from 'cn'
import { motion } from 'framer-motion'
import { timeColumn } from './components/time-column'

/**
 * Agenda do dia de UM profissional, como lista cronológica (P01). É o redesenho do painel para
 * 390px (PROJECT-CONTEXT §4.1): no celular não cabe uma coluna por profissional.
 */
export const DayList = (props: DayListProps) => {
  const { professional, now, onOpen, onFitIn } = props

  const renderRow = (row: AgendaRow) => {
    if (row.type === 'entry') {
      return (
        <div className="flex items-start gap-(--space-12)">
          {timeColumn(row.entry.start, `${row.entry.durationMinutes} min`)}
          <EntryCard entry={row.entry} now={now} onOpen={onOpen} />
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
            <AddIcon aria-hidden="true" className="size-4 shrink-0 text-(--text-link)" />
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
