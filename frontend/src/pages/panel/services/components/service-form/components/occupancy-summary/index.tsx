import { SECTION_CARD, minutesLabel } from '../../consts'

import type { OccupancySummaryProps } from './types'

const ROW = 'flex items-center gap-(--space-12)'

/**
 * "Como o horário é montado": a ocupação total (buffers + atendimento) é o que bloqueia a agenda,
 * não só a duração (modelo de domínio, §6).
 */
export const OccupancySummary = (props: OccupancySummaryProps) => {
  const { bufferBefore, duration, bufferAfter } = props

  const rows = [
    { label: 'Buffer antes', minutes: bufferBefore },
    { label: 'Atendimento', minutes: duration },
    { label: 'Buffer depois', minutes: bufferAfter },
  ]

  return (
    <section aria-labelledby="occupancy-title" className={SECTION_CARD}>
      <h2 id="occupancy-title" className="type-label text-(--text-strong)">
        Como o horário é montado
      </h2>
      <dl className="flex flex-col gap-(--space-8)">
        {rows.map(({ label, minutes }) => (
          <div key={label} className={ROW}>
            <dt className="type-caption min-w-0 flex-1 text-(--text-muted)">{label}</dt>
            <dd className="type-label tabular text-(--text-body)">{minutesLabel(minutes)}</dd>
          </div>
        ))}
        <hr className="border-(--border-subtle)" />
        <div className={ROW}>
          <dt className="type-caption min-w-0 flex-1 text-(--text-strong)">Bloqueia na agenda</dt>
          <dd className="type-label tabular text-(--text-strong)">
            {minutesLabel(bufferBefore + duration + bufferAfter)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
