import type { AppointmentCardProps } from './types'
import { StatusChip } from '../status-chip'
import { cn } from 'cn'

/** Card de agendamento da lista "Meus agendamentos" (Figma, tela 08). */
export const AppointmentCard = (props: AppointmentCardProps) => {
  const { businessName, status, summary, detail, actions, className } = props

  return (
    <article
      className={cn(
        'flex flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)',
        className,
      )}
    >
      <div className="flex items-center gap-(--space-12)">
        <h3 className="type-body min-w-0 flex-1 text-(--text-strong)">{businessName}</h3>
        <StatusChip status={status} className="shrink-0" />
      </div>
      <p className="type-caption tabular text-(--text-body)">{summary}</p>
      {detail}
      {actions}
    </article>
  )
}
