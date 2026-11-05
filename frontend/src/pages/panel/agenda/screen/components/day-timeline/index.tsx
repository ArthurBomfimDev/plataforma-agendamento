import type { AgendaProfessional } from '../../types'
import { EntryCard } from '../day-list/components/entry-card'
import { timeColumn } from '../day-list/components/time-column'
import { timelineOf } from './consts'

type DayTimelineProps = {
  professionals: ReadonlyArray<AgendaProfessional>
  now: Date
  onOpen: (id: string) => void
}

/**
 * A agenda do dia do atendente: uma lista só, em ordem de horário, com o profissional em cada item. O atendente responde
 * pelo balcão de todos, e a pergunta dele é "quem vem agora", não "como está a coluna de cada um". O filtro por
 * profissional fica na barra de filtros.
 */
export const DayTimeline = ({ professionals, now, onOpen }: DayTimelineProps) => (
  <ol aria-label="Agenda do dia, em ordem de horário" className="flex flex-col gap-(--space-8)">
    {timelineOf(professionals).map(({ entry, professionalName }) => (
      <li key={entry.id} className="flex items-start gap-(--space-12)">
        {timeColumn(entry.start, `${entry.durationMinutes} min`)}
        <EntryCard entry={entry} now={now} onOpen={onOpen} professionalName={professionalName} />
      </li>
    ))}
  </ol>
)
