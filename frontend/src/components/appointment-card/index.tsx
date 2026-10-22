import type { AppointmentCardProps } from './types'
import { StatusChip } from '@components/status-chip'
import { cn } from 'cn'

/**
 * Card de agendamento da lista "Meus agendamentos" (Figma, tela 08; desktop: 08D). No celular é
 * empilhado; no desktop vira linha, com miniatura à esquerda e ações à direita.
 */
export const AppointmentCard = (props: AppointmentCardProps) => {
  const {
    businessName,
    status,
    summary,
    serviceLine,
    whenLine,
    detail,
    actions,
    highlight,
    imageUrl,
    className,
  } = props

  return (
    <article
      className={cn(
        'flex flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16) lg:flex-row lg:items-center lg:gap-(--space-20) lg:p-(--space-20)',
        highlight && 'lg:border-2 lg:border-(--marker-urgent-fg)',
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="hidden size-18 shrink-0 rounded-md object-cover lg:block"
        />
      ) : (
        <div
          aria-hidden="true"
          className="hidden size-18 shrink-0 rounded-md bg-(--bg-disabled) lg:block"
        />
      )}

      <div className="flex flex-col gap-(--space-12) lg:min-w-0 lg:flex-1 lg:gap-(--space-4)">
        <div className="flex items-center gap-(--space-12) lg:gap-(--space-8)">
          <h3 className="type-body min-w-0 flex-1 text-(--text-strong) lg:flex-none">
            {businessName}
          </h3>
          <StatusChip status={status} className="shrink-0" />
        </div>
        <p className="type-caption tabular text-(--text-body) lg:hidden">{summary}</p>
        <p className="type-caption tabular hidden text-(--text-muted) lg:block">{serviceLine}</p>
        <p className="type-label tabular hidden text-(--text-body) lg:block">{whenLine}</p>
        {detail}
      </div>

      {actions && <div className="lg:shrink-0">{actions}</div>}
    </article>
  )
}
