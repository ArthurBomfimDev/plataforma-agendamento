import { AnimatePresence, motion } from 'framer-motion'
import { CARD, DEFAULT_RANGE, TEXT_ACTION, WEEKDAYS, isWorking, rangesLabel } from '../../consts'

import { DayEditor } from '../day-editor'
import { Switch } from '@components/switch'
import type { WeekScheduleCardProps } from './types'
import { cn } from 'cn'

/**
 * "Semana recorrente" (tela 12): um interruptor por dia, as faixas por escrito e "editar", que abre
 * o editor do dia logo abaixo da linha. Um dia por vez em edição.
 */
export const WeekScheduleCard = (props: WeekScheduleCardProps) => {
  const { schedule, editingDay, onToggleDay, onEditDay, onCancelEdit, onSaveDay } = props

  return (
    <section aria-labelledby="week-schedule-title" className={cn(CARD, 'gap-(--space-2)')}>
      <h2 id="week-schedule-title" className="type-label text-(--text-strong)">
        Semana recorrente
      </h2>

      <ul className="flex flex-col gap-(--space-2)">
        {WEEKDAYS.map(({ id, label }) => {
          const day = schedule[id]
          const working = isWorking(day)
          const editing = editingDay === id
          const labelId = `week-day-${id}`

          return (
            <li key={id} className="flex flex-col gap-(--space-2)">
              <div className="flex min-h-(--size-touch-min) items-center gap-(--space-12) px-(--space-2) py-(--space-8)">
                <Switch
                  aria-labelledby={labelId}
                  checked={day.enabled}
                  onCheckedChange={(enabled) => onToggleDay(id, enabled)}
                />
                <span
                  id={labelId}
                  className={cn(
                    'type-label w-14 shrink-0 sm:w-18',
                    working ? 'text-(--text-strong)' : 'text-(--text-muted)',
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    'type-body tabular min-w-0 flex-1',
                    working ? 'text-(--text-body)' : 'text-(--text-disabled)',
                  )}
                >
                  {working ? rangesLabel(day.ranges) : 'Sem expediente'}
                </span>
                <button
                  type="button"
                  aria-expanded={editing}
                  aria-label={`Editar ${label.toLowerCase()}`}
                  onClick={() => (editing ? onCancelEdit() : onEditDay(id))}
                  // 44px de alvo sem esticar a linha: a margem negativa come o padding dela.
                  className={cn(TEXT_ACTION, '-my-(--space-8)')}
                >
                  editar
                </button>
              </div>

              <AnimatePresence initial={false}>
                {editing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    // O contorno de foco dos campos não pode ser cortado pela animação de altura.
                    className="-m-1 overflow-hidden p-1"
                  >
                    <DayEditor
                      dayLabel={label}
                      initialRanges={day.ranges.length > 0 ? day.ranges : [DEFAULT_RANGE]}
                      onCancel={onCancelEdit}
                      onSave={(ranges, toWorkdays) => onSaveDay(id, ranges, toWorkdays)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>

      <p className="type-caption text-(--text-muted)">
        A ausência de faixa é a pausa. Duas faixas no mesmo dia representam o almoço.
      </p>
    </section>
  )
}
